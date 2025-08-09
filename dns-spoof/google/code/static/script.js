function togglePasswordVisibility() {
    const passwordField = document.getElementById('password');
    const showPasswordCheckbox = document.getElementById('show-password');

    if (passwordField && showPasswordCheckbox) {
        if (showPasswordCheckbox.checked) {
            passwordField.type = 'text';
        } else {
            passwordField.type = 'password';
        }
    }
}

// Implement Google-like floating label functionality for input fields
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.input-group input').forEach(input => {
        // Trigger the label float on page load if input has content (e.g., from browser autofill)
        if (input.value) {
            input.classList.add('has-content');
        }

        input.addEventListener('focus', () => {
            input.classList.add('is-focused');
            input.classList.add('has-content'); // Assume content when focused
        });

        input.addEventListener('blur', () => {
            input.classList.remove('is-focused');
            if (!input.value) {
                input.classList.remove('has-content');
            }
        });
        
        // This is a workaround for the `:not(:placeholder-shown)` pseudo-class
        // The CSS rule `input:not(:placeholder-shown) + label` should handle this,
        // but JavaScript can ensure it works consistently especially with autofill.
        input.addEventListener('input', () => {
            if (input.value) {
                input.classList.add('has-content');
            } else {
                input.classList.remove('has-content');
            }
        });
    });
});
