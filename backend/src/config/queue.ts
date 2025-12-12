import { Queue, Worker, QueueOptions, WorkerOptions, Job } from 'bullmq';
import { logger } from '../utils/logger';

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

// Queue options
const defaultQueueOptions: QueueOptions = {
  connection: REDIS_CONNECTION,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
};

// Worker options
const defaultWorkerOptions: Partial<WorkerOptions> = {
  connection: REDIS_CONNECTION,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  autorun: true,
};

/**
 * Conversation processing queue
 */
export const conversationQueue = new Queue('conversation-processing', defaultQueueOptions);

/**
 * OCR processing queue
 */
export const ocrQueue = new Queue('ocr-processing', defaultQueueOptions);

/**
 * Add conversation job to queue
 */
export const addConversationJob = async (conversationId: string) => {
  try {
    const job = await conversationQueue.add(
      'process-conversation',
      { conversationId },
      {
        jobId: conversationId,
        timeout: parseInt(process.env.JOB_TIMEOUT_MS || '300000', 10),
      }
    );
    
    logger.info('Conversation job added to queue', {
      jobId: job.id,
      conversationId,
    });
    
    return job;
  } catch (error) {
    logger.error('Failed to add conversation job to queue', {
      conversationId,
      error,
    });
    throw error;
  }
};

/**
 * Add OCR job to queue
 */
export const addOCRJob = async (reportId: string) => {
  try {
    const job = await ocrQueue.add(
      'process-ocr',
      { reportId },
      {
        jobId: reportId,
        timeout: parseInt(process.env.JOB_TIMEOUT_MS || '300000', 10),
      }
    );
    
    logger.info('OCR job added to queue', {
      jobId: job.id,
      reportId,
    });
    
    return job;
  } catch (error) {
    logger.error('Failed to add OCR job to queue', {
      reportId,
      error,
    });
    throw error;
  }
};

/**
 * Get job status
 */
export const getJobStatus = async (
  queueName: 'conversation-processing' | 'ocr-processing',
  jobId: string
) => {
  const queue = queueName === 'conversation-processing' ? conversationQueue : ocrQueue;
  const job = await queue.getJob(jobId);
  
  if (!job) {
    return null;
  }
  
  const state = await job.getState();
  const progress = job.progress;
  const returnValue = job.returnvalue;
  const failedReason = job.failedReason;
  
  return {
    id: job.id,
    state,
    progress,
    returnValue,
    failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
  };
};

/**
 * Close all queues
 */
export const closeQueues = async () => {
  await conversationQueue.close();
  await ocrQueue.close();
  logger.info('All queues closed');
};

/**
 * Health check for queues
 */
export const checkQueuesHealth = async (): Promise<{
  conversation: boolean;
  ocr: boolean;
}> => {
  try {
    await conversationQueue.client.ping();
    await ocrQueue.client.ping();
    
    return {
      conversation: true,
      ocr: true,
    };
  } catch (error) {
    logger.error('Queue health check failed', { error });
    return {
      conversation: false,
      ocr: false,
    };
  }
};

// Queue event listeners
conversationQueue.on('error', (error) => {
  logger.error('Conversation queue error', { error });
});

conversationQueue.on('waiting', (jobId) => {
  logger.debug('Job waiting in conversation queue', { jobId });
});

conversationQueue.on('active', (job) => {
  logger.info('Job started processing', {
    jobId: job.id,
    name: job.name,
  });
});

conversationQueue.on('completed', (job) => {
  logger.info('Job completed', {
    jobId: job.id,
    name: job.name,
    returnValue: job.returnvalue,
  });
});

conversationQueue.on('failed', (job, err) => {
  logger.error('Job failed', {
    jobId: job?.id,
    name: job?.name,
    error: err.message,
    attemptsMade: job?.attemptsMade,
  });
});

ocrQueue.on('error', (error) => {
  logger.error('OCR queue error', { error });
});

ocrQueue.on('completed', (job) => {
  logger.info('OCR job completed', {
    jobId: job.id,
    name: job.name,
  });
});

ocrQueue.on('failed', (job, err) => {
  logger.error('OCR job failed', {
    jobId: job?.id,
    name: job?.name,
    error: err.message,
  });
});

