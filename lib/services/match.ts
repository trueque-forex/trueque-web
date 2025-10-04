import axios from 'axios';

export async function fetchRateIntegrity(matchId: string) {
  const response = await axios.get(`/api/match/${matchId}/integrity`);
  return response.data;
}