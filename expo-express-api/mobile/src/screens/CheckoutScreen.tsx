import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { calculateDistance, calculateDeliveryFee } from '../utils/location';

export default function CheckoutScreen({ navigation, route }: any) {
    // In a real app, shop data comes from cart context or route params
    const mockShopData = {
        id: 101,
        shopName: 'Kakinada Kitchen',
        address: 'Bhanugudi Junction',
        latitude: 16.9535,
        longitude: 82.2384
    };

    const mockUserPayload = {
        userId: 'VE-20260228-001',
        username: 'venkata',
        email: 'v@example.com',
        address: 'Foodsy HQ Road, Door 1',
        city: 'Kakinada',
        latitude: 16.9605,
        longitude: 82.2400
    };

    // Example data payload usually imported from CartContext
    const myCart = [{ productId: '1', name: 'Veg Biryani', price: 150, quantity: 2 }];
    const checkoutSubtotal = 300;

    const [distance, setDistance] = useState(0);
    const [deliverySurcharge, setDeliverySurcharge] = useState(0);

    useEffect(() => {
        // Calculate distance on mount
        const calcDist = calculateDistance(
            mockUserPayload.latitude,
            mockUserPayload.longitude,
            mockShopData.latitude,
            mockShopData.longitude
        );
        setDistance(calcDist);
        setDeliverySurcharge(calculateDeliveryFee(calcDist));
    }, []);

    const currentTotalAmount = checkoutSubtotal + deliverySurcharge;

    const [mobileNumber, setMobileNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const performCheckout = async () => {
        // Exactly 10 digits validation checks directly in frontend via robust RegEx
        if (!/^[0-9]{10}$/.test(mobileNumber)) {
            Alert.alert('Validation Error', 'Mobile number MUST be exactly 10 digits and fully numeric.');
            return;
        }

        setLoading(true);
        try {
            const orderPayloadSchema = {
                userId: mockUserPayload.userId,
                shopId: mockShopData.id,
                mobileNumber,
                distance,
                deliveryFee: deliverySurcharge,
                cartItems: myCart,
                subtotal: checkoutSubtotal,
                totalAmount: currentTotalAmount,
                status: 'Confirmed'
            };

            // Async DB Push REST Endpoint Call
            // const res = await fetch('http://localhost:3000/api/orders', { method: 'POST', body: JSON.stringify(orderPayloadSchema) });
            const systemOrderIdGenerated = 'ORD-20260228-001';

            Alert.alert("Success", "Order successfully transmitted!");
            navigation.navigate('Invoice', {
                orderId: systemOrderIdGenerated,
                orderPayload: orderPayloadSchema,
                userRecord: mockUserPayload,
                shopRecord: mockShopData
            });

        } catch (e: any) {
            Alert.alert('Network Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Checkout</Text>

            <View style={styles.shopBox}>
                <Text style={styles.label}>Ordering From:</Text>
                <Text style={styles.value}>{mockShopData.shopName}</Text>
                <Text style={styles.subValue}>{mockShopData.address}</Text>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.label}>Delivering To: (Non-editable)</Text>
                <Text style={styles.value}>{mockUserPayload.address}</Text>
                <Text style={styles.subValue}>{mockUserPayload.city}</Text>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Recipient Mobile Number:</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={10}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    placeholder="Required: Make sure it's 10 digits"
                    editable={!loading}
                />
            </View>

            <View style={styles.cardBox}>
                <Text style={styles.summaryText}>Cart Subtotal: ₹{checkoutSubtotal}</Text>
                <Text style={styles.summaryText}>Distance: {distance} KM</Text>
                <Text style={styles.summaryText}>Delivery Fee: ₹{deliverySurcharge}</Text>
                <Text style={styles.totalText}>To Pay Total: ₹{currentTotalAmount}</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="orange" />
            ) : (
                <Button title="Confirm Pre-auth Expected Order" onPress={performCheckout} color="orange" />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
    header: { fontSize: 26, fontWeight: '900', marginBottom: 25, color: '#f97316' },
    shopBox: { backgroundColor: '#f0fdf4', padding: 20, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#86efac' },
    infoBox: { backgroundColor: '#fff7ed', padding: 20, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#fdba74' },
    cardBox: { backgroundColor: '#f3f4f6', padding: 20, borderRadius: 10, marginVertical: 20 },
    label: { fontSize: 13, color: '#6b7280', marginBottom: 5, fontWeight: 'bold' },
    value: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
    subValue: { fontSize: 14, color: '#4b5563', marginTop: 3 },
    inputContainer: { marginBottom: 15 },
    input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: '#f9fafb' },
    summaryText: { fontSize: 15, marginBottom: 6, color: '#4b5563', fontWeight: 'bold' },
    totalText: { fontSize: 22, fontWeight: '900', marginTop: 15, color: '#111827' }
});
