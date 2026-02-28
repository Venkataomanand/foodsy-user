import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

export default function AdminDashboardScreen() {
    const [globalOrders, setGlobalOrders] = useState<any[]>([]);

    useEffect(() => {
        // API Call Fetching Linked Data Example
        setGlobalOrders([
            {
                orderId: 'ORD-20260228-001',
                userId: 'VE-20260228-001',
                username: 'venkata',
                email: 'v@example.com',
                address: '123 Main St',
                city: 'Kakinada',
                mobileNumber: '9876543210',
                shopName: 'Kakinada Kitchen',
                shopAddress: 'Bhanugudi Junction',
                distance: 2,
                deliveryFee: 25,
                cartItems: [{ name: 'Veg Biryani', quantity: 2, price: 150 }],
                totalAmount: 325,
                status: 'Confirmed',
                createdAt: new Date().toISOString()
            },
            {
                orderId: 'ORD-20260228-002',
                userId: 'A0-20260228-002',
                username: 'a',
                email: 'a@example.com',
                address: 'Downtown Avenue',
                city: 'Kakinada',
                mobileNumber: '9999999999',
                shopName: 'Fresh Veggies Shop',
                shopAddress: 'Main Market Road',
                distance: 4,
                deliveryFee: 45,
                cartItems: [{ name: 'Pizza', quantity: 1, price: 400 }],
                totalAmount: 445,
                status: 'Preparing',
                createdAt: new Date().toISOString()
            }
        ]);
    }, []);

    const triggerStatusUpdatePrompt = (orderId: string, idx: number) => {
        Alert.alert("Manage Order Logistics", `Updating status for ${orderId}`, [
            { text: "Update to Preparing", onPress: () => processStatusUpdate(idx, "Preparing") },
            { text: "Update to On the Way", onPress: () => processStatusUpdate(idx, "On the Way") },
            { text: "Update to Delivered", onPress: () => processStatusUpdate(idx, "Delivered") },
            { text: "Abort", style: "cancel" }
        ]);
    };

    const processStatusUpdate = (idx: number, stringStatus: string) => {
        const listSnapshot = [...globalOrders];
        listSnapshot[idx].status = stringStatus;
        setGlobalOrders(listSnapshot);
        // Fire patch command to sync DB
        // e.g. await fetch(`/api/admin/orders/${listSnapshot[idx].orderId}`, { method: 'PATCH', body: JSON.stringify({ status: stringStatus }) })
    };

    const drawOrderCard = ({ item, index }: any) => {
        let statusColor = '#f97316';
        if (item.status === 'Delivered') statusColor = '#16a34a';
        if (item.status === 'On the Way') statusColor = '#2563eb';

        return (
            <View style={styles.cardWrapper}>
                <View style={styles.cardHeader}>
                    <Text style={styles.headerId}>{item.orderId}</Text>
                    <Text style={styles.headerDate}>{new Date(item.createdAt).toLocaleTimeString()}   |   {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>

                <View style={styles.detailPack}>
                    <Text style={styles.cardText}><Text style={styles.keyBold}>Consumer Link:</Text> {item.username}  ({item.userId})</Text>
                    <Text style={styles.cardText}><Text style={styles.keyBold}>Phone Contact:</Text> {item.mobileNumber}  |  {item.email}</Text>
                    <Text style={styles.cardText}><Text style={styles.keyBold}>Drop Address:</Text> {item.address}, {item.city}</Text>
                </View>

                <View style={[styles.detailPack, { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }]}>
                    <Text style={styles.cardText}><Text style={styles.keyBold}>Shop Source:</Text> {item.shopName}</Text>
                    <Text style={styles.cardText}><Text style={styles.keyBold}>Shop Location:</Text> {item.shopAddress}</Text>
                    <Text style={styles.cardText}><Text style={styles.keyBold}>Logistics:</Text> {item.distance} KM Distance  |  ₹{item.deliveryFee} Fee</Text>
                </View>

                <View style={styles.itemsPack}>
                    <Text style={[styles.keyBold, { marginBottom: 6 }]}>Food Items Queued:</Text>
                    {item.cartItems.map((cartSlot: any, iterId: number) => (
                        <Text key={iterId} style={styles.cartDetailBulleted}>•  {cartSlot.quantity}  x  {cartSlot.name}   |   ₹{cartSlot.price * cartSlot.quantity}</Text>
                    ))}
                    <Text style={styles.largeTotalText}>Final Transaction: ₹{item.totalAmount}</Text>
                </View>

                <View style={styles.controlRibbon}>
                    <Text style={[styles.badgePill, { color: statusColor, borderColor: statusColor }]}>{item.status}</Text>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => triggerStatusUpdatePrompt(item.orderId, index)}>
                        <Text style={styles.actionBtnText}>Modify State</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.rootBox}>
            <Text style={styles.topHeaders}>Admin Ops Dashboard</Text>
            <FlatList
                data={globalOrders}
                keyExtractor={(item) => item.orderId}
                renderItem={drawOrderCard}
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    rootBox: { flex: 1, backgroundColor: '#f1f5f9', padding: 14 },
    topHeaders: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 18, marginTop: 10, paddingLeft: 4 },

    cardWrapper: { backgroundColor: '#ffffff', padding: 18, borderRadius: 12, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: '#f3f4f6', paddingBottom: 10, marginBottom: 10 },
    headerId: { fontWeight: '900', fontSize: 16, color: '#111827' },
    headerDate: { color: '#6b7280', fontSize: 11, fontWeight: 'bold' },

    detailPack: { marginBottom: 12 },
    cardText: { fontSize: 14, color: '#374151', marginBottom: 5, lineHeight: 20 },
    keyBold: { fontWeight: '800', color: '#1f2937' },

    itemsPack: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8 },
    cartDetailBulleted: { color: '#4b5563', fontSize: 13, marginBottom: 4 },
    largeTotalText: { fontWeight: '900', fontSize: 16, color: '#111827', marginTop: 12, textAlign: 'right' },

    controlRibbon: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
    badgePill: { fontWeight: '800', fontSize: 13, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, textTransform: 'uppercase' },
    actionBtn: { backgroundColor: '#f97316', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    actionBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 }
});
