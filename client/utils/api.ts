import { Place, FilterParams, RouletteRequest } from './types';

// Use relative path for API calls (works for both local dev and Vercel deployment)
// In development, if NEXT_PUBLIC_API_URL is set, use it (for separate backend server)
// Otherwise, use relative path (for Vercel Serverless Functions)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Helper function to handle fetch with timeout and better error handling
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle different types of network errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('請求超時，請檢查您的網路連線或稍後再試');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('無法連接到伺服器。請檢查您的網路連線、VPN 設定，或確認伺服器是否正在運行');
      }
      if (error.message.includes('ERR_INTERNET_DISCONNECTED') || error.message.includes('ERR_NETWORK_CHANGED')) {
        throw new Error('網路連線中斷，請檢查您的網路設定');
      }
    }
    
    // Re-throw with a user-friendly message
    throw new Error(`連線錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

export async function fetchPlaces(params: FilterParams): Promise<Place[]> {
  const queryParams = new URLSearchParams();
  
  if (params.lat) queryParams.append('lat', params.lat.toString());
  if (params.lng) queryParams.append('lng', params.lng.toString());
  if (params.radius) queryParams.append('radius', params.radius.toString());
  if (params.price_max) queryParams.append('price_max', params.price_max.toString());
  if (params.rating_min) queryParams.append('rating_min', params.rating_min.toString());
  if (params.categories) {
    params.categories.forEach(cat => queryParams.append('categories[]', cat));
  }
  if (params.features) {
    params.features.forEach(feat => queryParams.append('features[]', feat));
  }
  if (params.open_now !== undefined) {
    queryParams.append('open_now', params.open_now.toString());
  }

  const url = `${API_URL}/api/places?${queryParams.toString()}`;
  console.log('Fetching places from:', url);
  
  try {
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      throw new Error(`無法取得地點列表: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Re-throw with better error message if it's already our custom error
    if (error instanceof Error && error.message.includes('連線錯誤') || error.message.includes('無法連接')) {
      throw error;
    }
    // Otherwise wrap it
    throw new Error(`載入地點時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

export async function fetchPlace(id: string): Promise<Place> {
  const url = `${API_URL}/api/places/${id}`;
  
  try {
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      throw new Error(`無法取得地點詳情: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    // Re-throw with better error message if it's already our custom error
    if (error instanceof Error && (error.message.includes('連線錯誤') || error.message.includes('無法連接'))) {
      throw error;
    }
    // Otherwise wrap it
    throw new Error(`載入地點詳情時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

export async function spinRoulette(request: RouletteRequest): Promise<Place> {
  const url = `${API_URL}/api/roulette`;
  
  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      throw new Error(`無法執行轉盤: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    // Re-throw with better error message if it's already our custom error
    if (error instanceof Error && (error.message.includes('連線錯誤') || error.message.includes('無法連接'))) {
      throw error;
    }
    // Otherwise wrap it
    throw new Error(`執行轉盤時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

