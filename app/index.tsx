import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    const { isAuthenticated, isLoading, role } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    if (role === 'doctor') {
        return <Redirect href="/(doctor)/patients" />;
    }

    if (role === 'admin') {
        return <Redirect href="/(admin)/stats" />;
    }

    return <Redirect href="/(patient)/feed" />;
}
