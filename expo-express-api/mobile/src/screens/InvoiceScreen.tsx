import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function InvoiceScreen({ route }: any) {
    // Parsing parameters injected from Successful Checkout Process
    const { orderId, orderPayload, userRecord, shopRecord } = route?.params || {};

    return (
        <ScrollView style={styles.wrapper}>
            <View style={styles.headerTitleBox}>
                <Text style={styles.mainTitle}>Order Approved!</Text>
                <Text style={styles.subHeader}>Foodsy Official Invoice Receipt</Text>
            </View>

            <View style={styles.boxCard}>
                <View style={styles.pillBox}><Text style={styles.pillText}>Status: Confirmed</Text></View>
                <Text style={styles.boldDetail}>Invoice Num: INV-{orderId}</Text>
                <Text style={styles.boldDetail}>Database Order: {orderId}</Text>
                <Text style={styles.detail}>Delivery Estimates: 30 - 45 Minutes</Text>
            </View>

            <View style={styles.boxCard}>
                <Text style={styles.sectionHead}>Vendor Details</Text>
                <Text style={styles.detail}><Text style={styles.boldKey}>Shop Name:</Text> {shopRecord?.shopName}</Text>
                <Text style={styles.detail}><Text style={styles.boldKey}>Shop Location:</Text> {shopRecord?.address}</Text>
            </View>

            <View style={styles.boxCard}>
                <Text style={styles.sectionHead}>Consumer Target</Text>
                <Text style={styles.detail}><Text style={styles.boldKey}>ID Account:</Text> {userRecord?.userId}</Text>
                <Text style={styles.detail}><Text style={styles.boldKey}>Registrant:</Text> {userRecord?.username}</Text>
                <Text style={styles.detail}><Text style={styles.boldKey}>Email ID:</Text> {userRecord?.email}</Text>
                <Text style={styles.detail}><Text style={styles.boldKey}>Phone Contact:</Text> {orderPayload?.mobileNumber}</Text>
                <Text style={styles.detail}><Text style={styles.boldKey}>Physical Drop:</Text> {userRecord?.address}, {userRecord?.city}</Text>
                <Text style={styles.detail}><Text style={styles.boldKey}>Transit Path:</Text> {orderPayload?.distance} KM Travel Distance</Text>
            </View>

            <View style={styles.boxCard}>
                <Text style={styles.sectionHead}>Purchase Summary</Text>
                {orderPayload?.cartItems?.map((item: any, i: number) => (
                    <View key={i} style={styles.itemRow}>
                        <Text style={{ color: '#374151' }}>{item.quantity}  x  {item.name}</Text>
                        <Text style={{ fontWeight: '700' }}>₹{item.price * item.quantity}</Text>
                    </View>
                ))}
                <View style={styles.hr} />
                <View style={styles.itemRow}><Text style={styles.mutedText}>Items Subtotal</Text><Text style={styles.mutedText}>₹{orderPayload?.subtotal}</Text></View>
                <View style={styles.itemRow}><Text style={styles.mutedText}>Logistics / Delivery</Text><Text style={styles.mutedText}>₹{orderPayload?.deliveryFee}</Text></View>
                <View style={styles.hr} />
                <View style={styles.itemRow}><Text style={styles.grandTotal}>Grand Total Amount</Text><Text style={styles.grandTotal}>₹{orderPayload?.totalAmount}</Text></View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, padding: 18, backgroundColor: '#f3f4f6' },
    headerTitleBox: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
    mainTitle: { fontSize: 28, fontWeight: '900', color: '#16a34a' },
    subHeader: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: '#6b7280', marginTop: 4 },

    boxCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 14, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1.5 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    sectionHead: { fontSize: 17, fontWeight: '800', marginBottom: 15, borderBottomWidth: 1.5, borderBottomColor: '#f3f4f6', paddingBottom: 8, color: '#f97316' },

    pillBox: { backgroundColor: '#dcfce7', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, marginBottom: 15 },
    pillText: { color: '#166534', fontWeight: 'bold', fontSize: 12 },

    boldDetail: { fontSize: 15, fontWeight: '800', marginBottom: 4, color: '#111827' },
    detail: { fontSize: 14, marginBottom: 6, color: '#4b5563', lineHeight: 22 },
    boldKey: { fontWeight: '700', color: '#374151' },

    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    hr: { height: 1.5, backgroundColor: '#e5e7eb', marginVertical: 12 },

    mutedText: { color: '#6b7280', fontSize: 13 },
    grandTotal: { fontWeight: '900', fontSize: 18, color: '#111827' }
});
