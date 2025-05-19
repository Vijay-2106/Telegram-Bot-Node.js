module.exports = {
    success_response: (message, data, status_code) => {
        return {
            status: true,
            code: status_code,
            error: false,
            message: message,
            data
        }
    },
    error_response: (message, data, status_code) => {
        const codes = [200, 201, 400, 401, 404, 403, 422, 500];
        const find_code = codes.find((code) => code == status_code);
        status_code = !find_code ? 500 : find_code
        return {
            status: false,
            code: status_code,
            error: true,
            message: message,
            data
        }
    },
    validation_error: (message, data) => {
        return {
            status: false,
            code: 422,
            error: true,
            message: message,
            data
        }
    }
}