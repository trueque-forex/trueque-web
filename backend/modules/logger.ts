import winston from 'winston';

/**
 * Creates a centralized, audit-grade logger with location injection.
 * Logs are timestamped, structured, and ready for corridor-specific traceability.
 */

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Logs an event with optional location context.
 * If no location is provided, defaults to 'Redlands, CA'.
 *
 * @param level - Logging level ('info', 'warn', 'error')
 * @param message - Description of the event
 * @param details - Additional metadata (e.g., corridor, userId, reason)
 * @param location - Optional location string
 */
export const logWithLocation = (
  level: 'info' | 'warn' | 'error',
  message: string,
  details: Record<string, any> = {},
  location: string = 'Redlands, CA'
) => {
  logger.log(level, message, {
    ...details,
    location,
    timestamp: new Date().toISOString(),
  });
<<<<<<< HEAD
};
=======
};
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
