const ACCESS_TOKEN_KEY =
  "opticore_access_token";

const REFRESH_TOKEN_KEY =
  "opticore_refresh_token";

export const authStorage = {
  setTokens(accessToken, refreshToken) {
    localStorage.setItem(
      ACCESS_TOKEN_KEY,
      accessToken
    );

    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken
    );
  },

  getAccessToken() {
    return localStorage.getItem(
      ACCESS_TOKEN_KEY
    );
  },

  getRefreshToken() {
    return localStorage.getItem(
      REFRESH_TOKEN_KEY
    );
  },

  clear() {
    localStorage.removeItem(
      ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
      REFRESH_TOKEN_KEY
    );
  },
};