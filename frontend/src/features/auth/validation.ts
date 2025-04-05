// src/features/auth/validation.ts

/**
 * Validates an email address.
 *
 * This function checks if the provided email string matches the expected format.
 * It uses a regular expression to ensure the email is properly formatted.
 * 
 * @param email - The email address to validate.
 * @returns True if the email is valid, false otherwise.
 */
function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates a password.
 *
 * This function checks if the provided password string meets the required criteria.
 * It ensures the password is at least 8 characters long and contains a mix of uppercase
 * and lowercase letters, numbers, and special characters.
 * 
 * @param password - The password to validate.
 * @returns True if the password is valid, false otherwise.
 */
function validatePassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

/**
 * Validates a full name.
 *
 * This function checks if the provided full name string contains only alphabetic characters.
 * It uses a regular expression to ensure the name is properly formatted.
 * 
 * @param fullName - The full name to validate.
 * @returns True if the full name is valid, false otherwise.
 */
function validateFullName(fullName: string): boolean {
    const fullNameRegex = /^[a-zA-Z]+$/;
    return fullNameRegex.test(fullName);
}

export { validateEmail, validatePassword, validateFullName };







