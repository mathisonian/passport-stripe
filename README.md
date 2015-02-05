# Passport-Stripe

[Passport](http://passportjs.org/) strategy for authenticating with [Stripe Connect](http://www.stripe.com/connect)
using the OAuth 2.0 API.

This module lets you authenticate using Stripe Connect in your Node.js applications.
By plugging into Passport, Stripe Connect authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-stripe

## Usage

#### Configure Strategy

The Stripe Connect authentication strategy authenticates users using a Stripe
account and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a app ID, app secret, and callback URL.
```js

    passport.use(new StripeStrategy({
        clientID: STRIPE_ID,
        clientSecret: STRIPE_SECRET,
        callbackURL: "http://localhost:3000/auth/stripe/callback"
      },
      function(accessToken, refreshToken, stripe_properties, done) {
        User.findOrCreate({ stripeId: stripe_properties.stripe_user_id }, function (err, user) {
          return done(err, user);
        });
      }
    ));

```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'stripe'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:
```js
    app.get('/auth/stripe',
      passport.authenticate('stripe'));

    app.get('/auth/stripe/callback',
      passport.authenticate('stripe', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
      });
```

#### Scope

By default, stripe will authenticate with `read_only` permessions. `read_write` the permissions can be requested
via the `scope` option to `passport.authenticate()`.

For example:
```js
    app.get('/auth/stripe',
      passport.authenticate('stripe', { scope: 'read_write' }));
```

## Examples

Scotch.io has provided a [comprehensive tutorial](http://scotch.io/tutorials/javascript/easy-node-authentication-setup-and-local) using passport plugins.

## Credits

  - [Matthew Conlen](http://github.com/mathisonian)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) Matthew Conlen <[http://mathisonian.com/](http://mathisonian.com/)>
