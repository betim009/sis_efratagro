const authService = require("../services/authService");

const login = async (request, response, next) => {
  try {
    const result = await authService.login({
      email: request.body.email,
      password: request.body.password,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Autenticacao realizada com sucesso",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (request, response, next) => {
  try {
    const result = await authService.getAuthenticatedProfile(request.user);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const requestPasswordReset = async (request, response, next) => {
  try {
    const result = await authService.requestPasswordReset({
      email: request.body.email,
      request
    });

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const confirmPasswordReset = async (request, response, next) => {
  try {
    const result = await authService.confirmPasswordReset({
      token: request.body.token,
      newPassword: request.body.newPassword,
      request
    });

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (request, response, next) => {
  try {
    const result = await authService.logout(request.user, request);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  getMe,
  requestPasswordReset,
  confirmPasswordReset,
  logout
};
