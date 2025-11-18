import prisma from "../prisma/prisma.js";

export const startSession = async (req: any, res: any) => {
  const { mockInterviewId } = req.body;
  if (!mockInterviewId) {
    return res.status(401).json({
      message: "Invalid Session",
    });
  }

  try {
    const session = await prisma.session.create({
      data: {
        status: "PENDING",
        cameraTestPassed: false,
        micTestPassed: false,
        mockInterview: {
          connect: { id: mockInterviewId },
        },
        user: {
          connect: { id: req.user.id },
        },
      },
    });

    if (!session) {
      return res.status(401).json({
        message: "Unable to Start the session",
      });
    }

    return res.status(200).json({
      message: "session started successfully!!",
      sessionId: session.id,
      status: session.status,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const readyForInterview = async (req: any, res: any) => {
  const { cameraTestPassed, micTestPassed, sessionId } = req.body;

  if (!sessionId) {
    return res.status(401).json({ message: "Invalid Session" });
  }

  if (!cameraTestPassed || !micTestPassed) {
    return res.status(401).json({
      message: "Please pass camera and Mic test",
    });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const updateSession = await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        status: "READY",
        cameraTestPassed: true,
        micTestPassed: true,
      },
    });

    if (!updateSession) {
      return res.status(401).json({
        message: "Initiation of Interview is failed!",
      });
    }

    return res.status(201).json({
      message: "Session is ready for interview",
      sessionId: updateSession.id,
      status: updateSession.status,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const inProgressInterview = async (req: any, res: any) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(401).json({
      message: "Invalid Session",
    });
  }

  try {
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "READY") {
      return res.status(400).json({ message: "Session is not ready to start" });
    }

    const updateSession = await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    if (!updateSession) {
      return res.status(401).json({
        message: "Initiation of Interview is failed!",
      });
    }

    return res.status(201).json({
      message: "Interview started Successfully!!",
      sessionId: updateSession.id,
      status: updateSession.status,
      startedAt: updateSession.startedAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const cancelInterview = async (req: any, res: any) => {
  const { sessionId, cancelReason } = req.body;

  if (!sessionId) {
    return res.status(401).json({
      message: "Invalid Session",
    });
  }

  try {
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      return res.status(401).json({
        message: "session is not found!",
      });
    }

    if (session.status != "IN_PROGRESS") {
      return res.status(401).json({
        message: "Bad Request",
      });
    }

    const updateSession = await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: cancelReason,
      },
    });

    if (!updateSession) {
      return res.status(401).json({
        message: "cancelation failed!",
      });
    }

    return res.status(201).json({
      message: "Interview canceled !!",
      sessionId: updateSession.id,
      status: updateSession.status,
      canceledAt: updateSession.cancelledAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const completeInterview = async (req: any, res: any) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(401).json({
      message: "Invalid Session ",
    });
  }

  try {
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      return res.status(401).json({
        message: "session is not found!",
      });
    }

    if (session.status != "IN_PROGRESS") {
      return res.status(401).json({
        message: "Bad Request",
      });
    }

    if (session.userId != req.user) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }
    const updateSession = await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    if (!updateSession) {
      return res.status(401).json({
        message: "Completion failed!",
      });
    }

    return res.status(201).json({
      message: "Interview Completed Successfully!!",
      sessionId: updateSession.id,
      status: updateSession.status,
      completedAt: updateSession.completedAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
