/**
 * Handles automatic logout if a token is invalid or expired.
 */
const handleAuthFailure = () => {
  console.error("Authentication failed. Redirecting to login.");
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = '/login'; // Redirect to login page
};

/**
 * A reusable wrapper for the fetch API that automatically:
 * 1. Attaches the 'adminToken' from localStorage.
 * 2. Sets 'Content-Type' to 'application/json'.
 * 3. Handles 401/403 errors by logging the user out.
 * 4. Throws an error for other failed responses.
 */
export const adminApi = async (url, options = {}) => {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    // If there is no token, don't bother making the call.
    handleAuthFailure();
    return;
  }

  // 1. Prepare default headers
  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. Merge all options together
  const config = {
    ...options, // This includes 'method', 'body', etc.
    headers: {
      ...defaultHeaders,
      ...options.headers, // Allows overriding default headers if needed
    },
  };

  // 3. Make the API call
  try {
    const response = await fetch(url, config);

    // 4. Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      handleAuthFailure();
      throw new Error('Authentication failed');
    }

    // 5. Handle other errors (like 500 server error)
    if (!response.ok) {
        // --- START OF MODIFICATION ---
        // This block prevents the JSON.parse error
        let errorMessage = `Server Error: ${response.status} ${response.statusText}`;
        try {
            // Try to parse a JSON error message from the body
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            // Body was not JSON (e.g., HTML error page),
            // so we'll just use the statusText as our error.
            // This stops the crash.
        }
        throw new Error(errorMessage);
        // --- END OF MODIFICATION ---
    }

    // 6. Return successful data
    // Some responses (like DELETE) might not have a body
    if (response.status === 204) { // 204 No Content
      return { success: true };
    }
    
    return response.json(); // Parse and return the JSON data

  } catch (error) {
    // This catches network errors or errors we threw above
    console.error('API helper fetch error:', error.message);
    throw error; // Re-throw the error so the component can catch it
  }
};

// --- Optional: Pre-built methods for convenience ---

export const adminApiGet = (url) => 
  adminApi(url, { method: 'GET' });

export const adminApiPost = (url, body) => 
  adminApi(url, { method: 'POST', body: JSON.stringify(body) });

export const adminApiPut = (url, body) => 
  adminApi(url, { method: 'PUT', body: JSON.stringify(body) });

export const adminApiDelete = (url) => 
  adminApi(url, { method: 'DELETE' });
