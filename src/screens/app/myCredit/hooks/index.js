import { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import firestore from '@react-native-firebase/firestore';
import { useTranslation } from 'react-i18next';

export const useHooks = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector(state => state.auth.user);
    const { t } = useTranslation();

    useEffect(() => {
        if (!user?.id) return;

        const walletRef = firestore().collection('Wallet');
        
        // Query: Alle Wallet-Einträge des Users, sortiert nach createdOn absteigend (neueste zuerst)
        const q = walletRef
            .where('userId', '==', user.id)
            .orderBy('createdOn', 'desc')
            .limit(50);

        const unsubscribe = q.onSnapshot((snapshot) => {
            const historyData = [];
            snapshot.forEach((doc) => {
                const history = doc.data();
                historyData.push({
                    id: doc.id,
                    Date: new Date(history.createdOn).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    Activity: getActivityDisplayName(history.activity),
                    Amount: formatAmount(history),
                    // Ausgaben (rot): BoughtCoins und BoughtFreeMinutes
                    isRed: history.activity === 'BOUGHTCOINS' || history.activity === 'BOUGHTFREEMINUTES'
                });
            });
            setData(historyData);
            setLoading(false);
        }, (error) => {
            console.error("Error loading wallet history:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.id, t]);

    const getActivityDisplayName = (activity) => {
        // Verwende Übersetzungen für Aktivitätsnamen
        const activityMap = {
            'BOUGHTCOINS': t('BOUGHTCOINS'),
            'SUBSCRIPTION': t('SUBSCRIPTION'),
            'BOOST': t('BOOST'),
            'STEALTHMODE': t('STEALTHMODE'),
            'INVITATION': t('INVITATION'),
            'CONVERSATION': t('CONVERSATION'),
            'BOUGHTFREEMINUTES': t('BOUGHTFREEMINUTES'),
            'RECRUIT': t('RECRUIT')
        };
        return activityMap[activity] || activity;
    };

    const formatAmount = (history) => {
        if (history.activity === 'BOUGHTCOINS') {
            // Für gekaufte Coins: Zeige den Betrag in Coins
            return `${history.amount} ${t('COINS')}`;
        } else if (history.activity === 'BOUGHTFREEMINUTES') {
            // Für gekaufte Minuten: Zeige die ausgegebenen Coins
            return `${history.amount} ${t('COINS')}`;
        } else {
            // Für andere Aktivitäten: Zeige den Preis in USD
            const priceInDollars = history.price ? (history.price / 1000) : 0;
            return `$${priceInDollars.toFixed(2)}`;
        }
    };

    return { data, loading };
};