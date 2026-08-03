import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireGoogleAuth } from "@/lib/api-auth";
import {
  DOC_PATH,
  OnePasswordDoc,
  answersMatch,
  createSalt,
  hashAnswer,
  issueUnlockToken,
} from "@/lib/one-password";

export const dynamic = "force-dynamic";

function docRef() {
  const [col, id] = DOC_PATH.split("/") as [string, string];
  return getAdminDb().collection(col).doc(id);
}

/** Public-ish status — never returns hash/salt. Question only for signed-in users. */
export async function GET(req: NextRequest) {
  try {
    const user = await requireGoogleAuth(req);
    const snap = await docRef().get();

    if (!snap.exists) {
      return NextResponse.json({
        configured: false,
        question: null,
      });
    }

    const data = snap.data() as OnePasswordDoc;

    return NextResponse.json({
      configured: true,
      // Question is needed for unlock UI; hash/salt never leave the server.
      question: user ? data.question : null,
      ownerUid: user ? data.ownerUid : null,
      setupAt: data.setupAt,
    });
  } catch (error) {
    console.error("GET /api/one-password failed:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to load status", detail },
      { status: 500 }
    );
  }
}

/** First-time setup: one question + one answer. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireGoogleAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in with Google required." }, { status: 401 });
    }

    const existing = await docRef().get();
    if (existing.exists) {
      return NextResponse.json(
        { error: "One Password already configured. Use update to change it." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const question = String(body.question || "").trim();
    const answer = String(body.answer || "");

    if (question.length < 5 || question.length > 200) {
      return NextResponse.json(
        { error: "Question must be 5–200 characters." },
        { status: 400 }
      );
    }
    if (answer.trim().length < 2 || answer.trim().length > 120) {
      return NextResponse.json(
        { error: "Answer must be 2–120 characters." },
        { status: 400 }
      );
    }

    const salt = createSalt();
    const now = Date.now();
    const doc: OnePasswordDoc = {
      question,
      answerHash: hashAnswer(answer, salt),
      salt,
      ownerUid: user.uid,
      setupAt: now,
      updatedAt: now,
    };

    await docRef().set(doc);

    const unlockToken = issueUnlockToken(user.uid);

    return NextResponse.json({
      ok: true,
      configured: true,
      question,
      unlockToken,
      expiresInMs: 30 * 60 * 1000,
    });
  } catch (error) {
    console.error("POST /api/one-password failed:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to set up One Password", detail },
      { status: 500 }
    );
  }
}

/** Verify answer → unlock token for edit session. */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireGoogleAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in with Google required." }, { status: 401 });
    }

    const snap = await docRef().get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "One Password not set up yet.", code: "NOT_CONFIGURED" },
        { status: 404 }
      );
    }

    const data = snap.data() as OnePasswordDoc;
    const body = await req.json();
    const answer = String(body.answer || "");

    // Simple attempt logging (server-only collection)
    const attemptRef = getAdminDb()
      .collection("security")
      .doc(`attempts_${user.uid}`);
    const attemptSnap = await attemptRef.get();
    const attempts = (attemptSnap.data()?.fails as number) || 0;
    const lockedUntil = (attemptSnap.data()?.lockedUntil as number) || 0;

    if (lockedUntil > Date.now()) {
      return NextResponse.json(
        {
          error: "Too many failed attempts. Try again later.",
          code: "RATE_LIMITED",
          lockedUntil,
        },
        { status: 429 }
      );
    }

    if (!answersMatch(answer, data.salt, data.answerHash)) {
      const fails = attempts + 1;
      const update: Record<string, unknown> = {
        fails,
        lastFailAt: Date.now(),
      };
      if (fails >= 5) {
        update.lockedUntil = Date.now() + 15 * 60 * 1000;
        update.fails = 0;
      }
      await attemptRef.set(update, { merge: true });

      return NextResponse.json(
        { error: "Incorrect answer.", code: "WRONG_ANSWER" },
        { status: 403 }
      );
    }

    await attemptRef.set({ fails: 0, lockedUntil: 0, lastOkAt: Date.now() }, { merge: true });

    const unlockToken = issueUnlockToken(user.uid);
    return NextResponse.json({
      ok: true,
      unlockToken,
      question: data.question,
      expiresInMs: 30 * 60 * 1000,
    });
  } catch (error) {
    console.error("PUT /api/one-password failed:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

/** Change question/answer — requires current answer. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireGoogleAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in with Google required." }, { status: 401 });
    }

    const snap = await docRef().get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not configured yet." }, { status: 404 });
    }

    const data = snap.data() as OnePasswordDoc;
    if (data.ownerUid !== user.uid) {
      return NextResponse.json({ error: "Only the owner can update One Password." }, { status: 403 });
    }

    const body = await req.json();
    const currentAnswer = String(body.currentAnswer || "");
    const question = String(body.question || "").trim();
    const answer = String(body.answer || "");

    if (!answersMatch(currentAnswer, data.salt, data.answerHash)) {
      return NextResponse.json({ error: "Current answer is incorrect." }, { status: 403 });
    }

    if (question.length < 5 || question.length > 200) {
      return NextResponse.json({ error: "Question must be 5–200 characters." }, { status: 400 });
    }
    if (answer.trim().length < 2 || answer.trim().length > 120) {
      return NextResponse.json({ error: "Answer must be 2–120 characters." }, { status: 400 });
    }

    const salt = createSalt();
    await docRef().update({
      question,
      answerHash: hashAnswer(answer, salt),
      salt,
      updatedAt: Date.now(),
    });

    const unlockToken = issueUnlockToken(user.uid);
    return NextResponse.json({
      ok: true,
      question,
      unlockToken,
      expiresInMs: 30 * 60 * 1000,
    });
  } catch (error) {
    console.error("PATCH /api/one-password failed:", error);
    return NextResponse.json({ error: "Failed to update One Password" }, { status: 500 });
  }
}
