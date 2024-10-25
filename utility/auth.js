// auth.js
const auth = {
    getUserDetails: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/user/details', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Could not fetch user details');
      }
      return response.json();
    }
  };
  
  export default auth;
  