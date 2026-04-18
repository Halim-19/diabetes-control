import { useLocalSearchParams } from 'expo-router';
import PatientDetailScreen from '@/components/screens/PatientDetailScreen';

export default function PatientRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <PatientDetailScreen id={id} />;
}
