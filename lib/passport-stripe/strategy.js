/**
 * Module dependencies.
 */
var util = require('util')
  , url = require('url')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy
  , InternalOAuthError = require('passport-oauth').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The Stripe authentication strategy authenticates requests by delegating to
 * Stripe using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and `stripe` object, which contains additional info as outlined
 * here: https://stripe.com/docs/connect/oauth.
 * The callback should then call the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Stipe application's client ID
 *   - `clientSecret`  your Stipe application's App Secret
 *   - `callbackURL`   URL to which Stipe will redirect the user after granting authorization
 *
 * Examples:
 *     StripeStrategy = require('passport-stripe').Strategy;
 *
 *     ...
 *
 *     passport.use(new StripeStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/stripe/callback'
 *       },
 *       function(accessToken, refreshToken, stripe, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://connect.stripe.com/oauth/authorize';
  options.tokenURL = options.tokenURL || 'https://connect.stripe.com/oauth/token';
  options.scopeSeparator = options.scopeSeparator || ',';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'stripe';
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);


/**
 * Authenticate request by delegating to a service provider using OAuth 2.0.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req, options) {
  options = options || {};
  var self = this;

  if (req.query && req.query.error) {
    // TODO: Error information pertaining to OAuth 2.0 flows is encoded in the
    //       query parameters, and should be propagated to the application.
    return this.fail();
  }

  var callbackURL = options.callbackURL || this._callbackURL;
  if (callbackURL) {
    var parsed = url.parse(callbackURL);
    if (!parsed.protocol) {
      // The callback URL is relative, resolve a fully qualified URL from the
      // URL of the originating request.
      callbackURL = url.resolve(req.originalURL, callbackURL);
    }
  }

  if (req.query && req.query.code) {
    var code = req.query.code;

    // NOTE: The module oauth (0.9.5), which is a dependency, automatically adds
    //       a 'type=web_server' parameter to the percent-encoded data sent in
    //       the body of the access token request.  This appears to be an
    //       artifact from an earlier draft of OAuth 2.0 (draft 22, as of the
    //       time of this writing).  This parameter is not necessary, but its
    //       presence does not appear to cause any issues.
    this._oauth2.getOAuthAccessToken(code, { grant_type: 'authorization_code', redirect_uri: callbackURL },
      function(err, accessToken, refreshToken, params) {
        if (err) { return self.error(new InternalOAuthError('failed to obtain access token', err)); }

        function verified(err, user, info) {
          if (err) { return self.error(err); }
          if (!user) { return self.fail(info); }
          self.success(user, info);
        }

        // Generate the additional stripe object
        var stripe = {};
        stripe.token_type = params.token_type || null;
        stripe.stripe_publishable_key = params.stripe_publishable_key || null;
        stripe.scope = params.scope || null;
        stripe.livemode = params.livemode || null;
        stripe.stripe_user_id = params.stripe_user_id || null;


        if (self._passReqToCallback) {
          self._verify(req, accessToken, refreshToken, stripe, verified);
        } else {
          self._verify(accessToken, refreshToken, stripe, verified);
        }
      }
    );
  } else {
    // NOTE: The module oauth (0.9.5), which is a dependency, automatically adds
    //       a 'type=web_server' parameter to the query portion of the URL.
    //       This appears to be an artifact from an earlier draft of OAuth 2.0
    //       (draft 22, as of the time of this writing).  This parameter is not
    //       necessary, but its presence does not appear to cause any issues.

    var params = this.authorizationParams(options);
    params['response_type'] = 'code';
    params['redirect_uri'] = callbackURL;
    var scope = options.scope || this._scope;
    if (scope) {
      if (Array.isArray(scope)) { scope = scope.join(this._scopeSeparator); }
      params.scope = scope;
    }
    var state = options.state || req.query.state;
    if (state) { params.state = state; }

    var location = this._oauth2.getAuthorizeUrl(params);
    this.redirect(location);
  }
};

/**
* Override OAuth2 authorizeParams to allow for passing additional params
* per the "pre-fill" feature for Stripe https://stripe.com/docs/connect/reference#get-authorize-request
*
* @param {Object} options
*/

Strategy.prototype.authorizationParams = function(options){
    return options;
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
