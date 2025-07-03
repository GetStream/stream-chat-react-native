export const post = async (url: string, data: unknown = {}) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`An HTTP Error has occurred. Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
};
