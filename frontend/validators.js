/**
 * Validates a password against the 5 rules from DEC-008.
 * Returns an array of friendly error messages. If valid, returns an empty array.
 */
export function validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push("Please add at least 8 characters.");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Please add at least one uppercase letter.");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Please add at least one lowercase letter.");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Please add at least one number.");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("Please add at least one special character.");
    }

    return errors;
}