import { observable, flow, computed, action, makeObservable } from 'mobx'
const jwt = require('jsonwebtoken')
import { useApiFetch, useAuthApiFetch } from '../utils/fetch'
import { isServer } from '../utils';
export default class User {
  token
  tokenExpiry
  firstName
  lastName
  email
  role

  constructor() {
    makeObservable(this, {
      token: observable,
      tokenExpiry: observable,
      firstName: observable,
      lastName: observable,
      email: observable,
      role: observable,
      signedIn: computed,
      isAdministrator: computed,
      setRole: action,
      signUp: flow,
      signIn: flow,
      signOut: flow,
      refreshTokens: flow,
      forgotPassword: flow,
      resetPassword: flow
    })
  }

  get signedIn() {
    return !!this.token
  }

  get isAdministrator() {
    return this.role === 'administrator';
  }

  setRole = role => this.role = role;

  *signUp(firstname, lastname, email, password) {
    try {
      yield useApiFetch().post('/authenticator/signup', {
        firstname,
        lastname,
        email,
        password
      })
      return 200;
    } catch (error) {
      return error.response.status;
    }
  }

  *signIn(email, password) {
    try {
      const response = yield useApiFetch().post('/authenticator/signin', {
        email,
        password
      })
      const { accessToken } = response.data
      const { account: { firstname, lastname }, exp } = jwt.decode(accessToken)
      this.firstName = firstname
      this.lastName = lastname
      this.email = email
      this.tokenExpiry = exp
      this.token = accessToken
      return 200;
    } catch (error) {
      console.error(error);
      return error.response.status
    }
  }

  *signOut() {
    try {
      yield useApiFetch().delete('/authenticator/signout')
    } finally {
      this.firstName = undefined
      this.lastName = undefined
      this.email = undefined
      this.tokenExpiry = undefined
      this.token = undefined
    }
  }

  *refreshTokens(context) {
    try {
      let response;
      if (isServer()) {
        const authFetchApi = useAuthApiFetch(context.req.headers.cookie)
        response = yield authFetchApi.post('/authenticator/refreshtoken')

        const cookies = response.headers['set-cookie'];
        if (cookies) {
          context.res.setHeader('Set-Cookie', cookies);
        }
      } else {
        response = yield useApiFetch().post('/authenticator/refreshtoken')
      }
      const { accessToken } = response.data
      const { account: { firstname, lastname, email }, exp } = jwt.decode(accessToken)
      this.firstName = firstname
      this.lastName = lastname
      this.email = email
      this.tokenExpiry = exp
      this.token = accessToken
      return { status: 200 };
    } catch (error) {
      this.firstName = undefined
      this.lastName = undefined
      this.email = undefined
      this.tokenExpiry = undefined
      this.token = undefined
      console.error(error);
      return { status: error.response.status, error }
    }
  }

  *forgotPassword(email) {
    try {
      yield useApiFetch().post('/authenticator/forgotpassword', {
        email
      });
      return 200;
    } catch (error) {
      console.error(error);
      return error.response.status
    }
  }

  *resetPassword(resetToken, password) {
    try {
      yield useApiFetch().patch('/authenticator/resetpassword', {
        resetToken,
        password
      });
      return 200;
    } catch (error) {
      console.error(error);
      return error.response.status;
    }
  }
}
