// src/features/auth/auth-helper.ts

import { supabase } from "@/lib/supabase-client";
import { validateEmail, validatePassword, validateFullName } from "./validation";


/**
 * Signs up a new user with the provided email, password, and full name.
 *
 * This function validates the input parameters to ensure they meet the required
 * criteria for email, password, and full name. If any of the validations fail,
 * an error is thrown with a descriptive message. Upon successful validation,
 * the function attempts to create a new user account using Supabase's authentication
 * service. If the sign-up process encounters an error, it throws an error with
 * the message returned from Supabase.
 *
 * @param email - The email address of the user. Must be a valid email format.
 * @param password - The password for the user account. Must meet security requirements.
 * @param fullName - The full name of the user. Must consist of alphabetic characters only.
 * @returns A promise that resolves to the user data returned from Supabase upon successful sign-up.
 * @throws Throws an error if the email, password, or full name is invalid, or if the sign-up process fails.
 */
export async function signUp(email: string, password: string, fullName: string) {
    if (!validateEmail(email)) {
        throw new Error("Invalid email");
    }
    if (!validatePassword(password)) {
        throw new Error("Invalid password");
    }
    if (!validateFullName(fullName)) {
        throw new Error("Invalid full name");
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Signs in a user with the provided email and password.
 *
 * This function validates the input parameters to ensure they meet the required
 * criteria for email and password. If any of the validations fail, an error is
 * thrown with a descriptive message. Upon successful validation, the function
 * attempts to sign in the user using Supabase's authentication service. If the
 * sign-in process encounters an error, it throws an error with the message
 * returned from Supabase.
 *
 * @param email - The email address of the user. Must be a valid email format.
 * @param password - The password for the user account. Must meet security requirements.
 * @returns A promise that resolves to the user data returned from Supabase upon successful sign-in.
 * @throws Throws an error if the email or password is invalid, or if the sign-in process fails.
 */
export async function  signIn(email: string, password: string) {
    if (!validateEmail(email)) {
        throw new Error("Invalid email");
    }
    if (!validatePassword(password)) {
        throw new Error("Invalid password");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Signs out the currently authenticated user.
 *
 * This function attempts to sign out the user currently authenticated in Supabase.
 * If the sign-out process encounters an error, it throws an error with the message
 * returned from Supabase.
 *
 * @returns A promise that resolves when the user is successfully signed out.
 * @throws Throws an error if the sign-out process fails.
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }
}


