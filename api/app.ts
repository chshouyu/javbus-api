import express, { type NextFunction, type Request, type Response } from 'express';
import createError, { isHttpError } from 'http-errors';
import { RequestError } from 'got';
import session from 'express-session';
import memorystore from 'memorystore';
import v1Router from './router/v1/router.js';
import { QueryValidationError } from './utils.js';

// 扩展 express-session 的 SessionData
declare module 'express-session' {
  interface SessionData {
    user?: {
      username: string;
    };
  }
}

type UserResBody = { success: boolean; message: string };

type LoginRequest = Request<
  Record<string, never>,
  UserResBody,
  { username?: string; password?: string }
>;

type GetUserResponse = Response<{ username: string | undefined; useCredentials: boolean }>;

// 登录、退出的响应
type UserActionResponse = Response<UserResBody>;

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { JAVBUS_AUTH_TOKEN, ADMIN_USERNAME, ADMIN_PASSWORD, JAVBUS_SESSION_SECRET } = process.env;
const useCredentials = Boolean(ADMIN_USERNAME && ADMIN_PASSWORD);
const MemoryStore = memorystore(session);

app.use(
  session({
    cookie: {
      httpOnly: true,
      // 1 周
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: 'auto',
    },
    name: 'javbus.api.sid',
    resave: false,
    saveUninitialized: false,
    secret: JAVBUS_SESSION_SECRET || '_jav_bus_',
    store: new MemoryStore({
      checkPeriod: 24 * 60 * 60 * 1000, // prune expired entries every 24h
    }),
  }),
);

app.get('/api/user', (req, res: GetUserResponse) => {
  res.json({ username: req.session.user?.username, useCredentials });
});

app.post('/api/login', (req: LoginRequest, res: UserActionResponse) => {
  const { username, password } = req.body;
  if (username && username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.user = { username };
    res.json({ success: true, message: 'Login success' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

app.post('/api/logout', (req, res: UserActionResponse) => {
  req.session.destroy((err) => {
    if (err) {
      res.json({ success: false, message: (err as Error).message || 'Unknown error' });
    } else {
      res.json({ success: true, message: 'Logout success' });
    }
  });
});

app.use((req, res, next) => {
  const token = req.headers['j-auth-token'];
  const user = req.session.user;

  if (token) {
    if (token === JAVBUS_AUTH_TOKEN) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  } else if (useCredentials) {
    if (user) {
      next();
    } else {
      res.redirect('/login.html');
    }
  } else {
    next();
  }
});

app.use('/api/v1', v1Router);

app.use((_req, _res, next) => {
  next(new createError.NotFound());
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  let status: number;
  let messages: string[] = [];

  if (err instanceof QueryValidationError) {
    status = 400;
    messages = err.messages;
  } else if (err instanceof RequestError) {
    status = err.response?.statusCode || 500;
  } else if (isHttpError(err)) {
    status = err.statusCode;
  } else {
    status = 500;
  }

  res.status(status).json({ error: err.message || 'Unknown Error', messages });
});

export default app;