import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to welcome screen on app launch
  return <Redirect href="/welcome" />;
}

