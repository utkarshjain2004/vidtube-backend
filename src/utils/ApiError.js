class ApiError extends Error{
    constructor(statusCOde, message = "Something went wrong an error occurred", 
        errors = [],
        stack = ""
        
    ){
        super(message);
        this.statusCode = statusCOde;
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};