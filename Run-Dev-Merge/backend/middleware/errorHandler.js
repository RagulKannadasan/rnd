export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Firebase specific errors
  if (err.code) {
    switch (err.code) {
      case 'auth/user-not-found':
        error.message = 'User not found';
        error.status = 404;
        break;
      case 'auth/wrong-password':
        error.message = 'Invalid credentials';
        error.status = 401;
        break;
      case 'auth/email-already-in-use':
        error.message = 'Email already registered';
        error.status = 409;
        break;
      case 'auth/weak-password':
        error.message = 'Password should be at least 6 characters';
        error.status = 400;
        break;
      case 'auth/invalid-email':
        error.message = 'Invalid email format';
        error.status = 400;
        break;
      case 'permission-denied':
        error.message = 'Permission denied';
        error.status = 403;
        break;
      case 'not-found':
        error.message = 'Document not found';
        error.status = 404;
        break;
      case 'already-exists':
        error.message = 'Document already exists';
        error.status = 409;
        break;
      default:
        error.message = 'Firebase operation failed';
        error.status = 500;
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(val => val.message).join(', ');
    error.status = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  res.status(error.status).json(error);
};