"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("reflect-metadata");
require("dotenv/config");
const uuid_1 = require("uuid");
const cors_1 = tslib_1.__importDefault(require("cors"));
const express_1 = tslib_1.__importDefault(require("express"));
const express_session_1 = tslib_1.__importDefault(require("express-session"));
const typeorm_1 = require("typeorm");
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const auth_checker_1 = require("./utils/auth-checker");
const database_1 = tslib_1.__importDefault(require("./config/database"));
const redis_1 = require("./config/redis");
const email_1 = require("./config/email");
const user_resolver_1 = require("./resolvers/user.resolver");
const track_resolver_1 = require("./resolvers/track.resolver");
const create_user_dataloader_1 = require("./utils/create-user-dataloader");
const cache_tracks_1 = require("./utils/cache-tracks");
const PRODUCTION = process.env.NODE_ENV === "production";
const WORKERS = process.env.WEB_CONCURRENCY || 1;
const PORT = process.env.PORT || 5000;
const server = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const orm = yield typeorm_1.createConnection(database_1.default);
    const app = express_1.default();
    app.disable("x-powered-by");
    app.set("trust proxy", 1);
    app.use(cors_1.default({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }));
    app.use(express_session_1.default({
        name: "sid",
        genid: () => uuid_1.v4(),
        store: new redis_1.RedisStore({
            client: redis_1.redisClient,
            disableTouch: true,
            disableTTL: true,
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365,
            httpOnly: true,
            sameSite: "lax",
            secure: PRODUCTION,
        },
        secret: process.env.SESSION_SECRET || "secret",
        resave: false,
        saveUninitialized: false,
    }));
    const graphQLSchema = yield type_graphql_1.buildSchema({
        resolvers: [user_resolver_1.UserResolver, track_resolver_1.TrackResolver],
        validate: false,
        authChecker: auth_checker_1.authChecker,
    });
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: graphQLSchema,
        context: ({ req, res }) => ({
            req,
            res,
            redisClient: redis_1.redisClient,
            userLoader: create_user_dataloader_1.createUserDataLoader(),
        }),
    });
    apolloServer.applyMiddleware({ app, cors: false });
    cache_tracks_1.cacheTracks();
    app.use("/media", express_1.default.static("media"));
    if (orm.isConnected) {
        console.log(`🗄️  Connected to PostgreSQL database on port ${process.env.DB_PORT}`);
    }
    redis_1.redisClient.monitor((error, monitor) => {
        monitor.on("monitor", (time, args, source) => {
            console.log(time, args, source);
        });
        if (!error) {
            console.log(`📙 Connected to Redis on port ${process.env.REDIS_PORT}`);
        }
    });
    email_1.emailTransporter.verify((error) => {
        if (error) {
            console.log(error);
        }
        else {
            console.log(`📧 SMTP email server ready at ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
        }
    });
    app.listen(PORT, () => {
        console.log(`🚀 Node server running on port ${PORT}`);
    });
});
server().catch((err) => {
    console.error(err);
});
//# sourceMappingURL=index.js.map