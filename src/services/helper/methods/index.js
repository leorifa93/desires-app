import { UIManager, LayoutAnimation, Platform } from "react-native";
import { appointmentStatuses, orderStatuses, rolesTypes } from "../data";
import firestore from '@react-native-firebase/firestore'

// import { faker } from '@faker-js/faker'
import { colors } from "../../utilities";
import store from "../../../store";
import { Ethnicity, Gender } from "../../../constants/User";
import { Countries } from "../../../constants/Countries";
export const handleAnimation = () => {
    if (Platform.OS === "android") {
        UIManager.setLayoutAnimationEnabledExperimental &&
            UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
}

export const checkExpiry = () => {
    var d1 = Date.parse("2012-11-01");
    var d2 = Date.parse("2012-11-04");
    var expiryDate = Date.parse("2020-12-18");
    var currentDate = Date.now()
    console.log(expiryDate > currentDate)
    if (expiryDate < currentDate) {
        return true
    } else {
        return false
    }
}

export const compareDate = () => {
    var date1 = new Date('December 25, 2017 01:30:00');
    var date2 = new Date('June 18, 2016 02:30:00');
    console.log(date1.getTime() > date2.getTime())
    //best to use .getTime() to compare dates
    //if (date1.getTime() === date2.getTime()) {
    //same date
    //}

    if (date1.getTime() > date2.getTime()) {
        return true
    } else {
        return false
    }
}



//validations
export const validateEmail = email => {
    // const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const re = /^\s*(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))\s*$/;
    return re.test(email);
}
export const hasLowerCase = str => {
    return (/[a-z]/.test(str));
}
export const hasUpperCase = str => {
    return (/[A-Z]/.test(str));
}

export const getSelectedRole = role => {
    const isWeightLoss = role === rolesTypes.weight_loss
    const isMaintainWeight = role === rolesTypes.maintain_weight
    const isProfessionalDietitian = role === rolesTypes.professional_dietitian

    return { isWeightLoss, isMaintainWeight, isProfessionalDietitian }
}

export function cmToFeetAndInches(cm) {
    const inches = cm / 2.54;
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    return `${feet}' ${remainingInches}"`;
}

export function kgToPounds(kilograms) {
    const pounds = Math.floor(kilograms * 2.20462);
    return `${pounds}`;
}

// export function generateRandomUsers() {
//     const isDietitian = faker.datatype.boolean();
//     const firstName = faker.person.firstName();
//     const lastName = faker.person.lastName();
//     const image = faker.image.avatar();

//     if (isDietitian) {
//         const rating = faker.number.int({ min: 0, max: 5, precision: 0.1 });
//         const reviewsCount = faker.number.int({ min: 1, max: 100 });

//         return {
//             firstName,
//             lastName,
//             image,
//             isDietitian,
//             rating,
//             reviewsCount,
//         };
//     } else {
//         return {
//             firstName,
//             lastName,
//             image,
//             isDietitian,
//         };
//     }
// }

export const getOrderStatus = (status) => {
    const isPending = status === orderStatuses.pending
    const isInProgress = status === orderStatuses.inProgress
    const isCompleted = status === orderStatuses.completed
    const isCanelled = status === orderStatuses.canelled

    return {
        isPending, isInProgress, isCompleted, isCanelled
    }
}


export const getOrderStatusInfo = (status) => {
    const { isPending, isInProgress, isCompleted, isCanelled } = getOrderStatus(status)
    const label =
        isPending ? 'Pending'
            :
            isInProgress ? 'In Progress'
                :
                isCompleted ? 'Completed'
                    :
                    isCanelled ? 'Cancelled'
                        :
                        ''
    const tintColor =
        isPending ? colors.appTextColor4
            :
            isInProgress ? colors.warning
                :
                isCompleted ? colors.success
                    :
                    isCanelled ? colors.error
                        :
                        colors.appColor1

    return {
        label, tintColor
    }
}

export const getAppointmentStatus = (status) => {
    const isPending = status === appointmentStatuses.pending
    const isConfirmed = status === appointmentStatuses.confirmed
    const isCompleted = status === appointmentStatuses.completed
    const isCanelled = status === appointmentStatuses.canelled

    return {
        isPending, isConfirmed, isCompleted, isCanelled
    }
}


export const getAppointmentStatusInfo = (status) => {
    const { isPending, isConfirmed, isCompleted, isCanelled } = getAppointmentStatus(status)

    const { isProfessionalDietitianRole } = getReduxStore()
    const label =
        isPending ? !isProfessionalDietitianRole ? 'Pending' : 'New Request'
            :
            isConfirmed ? 'Confirmed'
                :
                isCompleted ? 'Completed'
                    :
                    isCanelled ? 'Cancelled'
                        :
                        ''
    const tintColor =
        isPending ? colors.warning
            :
            isConfirmed ? colors.appColor2
                :
                isCompleted ? colors.success
                    :
                    isCanelled ? colors.error
                        :
                        colors.appColor1

    return {
        label, tintColor
    }
}

export const getReduxStore = () => {
    const storeState = store.getState()
    const signedInUser = storeState.auth.signedInUser
    return {
        signedInUser,
    }
}

export const getUserRole = (type) => {
    const isMaintainWeightRole = type === rolesTypes.maintain_weight
    const isWeightLossRole = type === rolesTypes.weight_loss
    const isProfessionalDietitianRole = type === rolesTypes.professional_dietitian
    return { isMaintainWeightRole, isWeightLossRole, isProfessionalDietitianRole }
}

export const getFirestoreDate = () => {
    return new Date(firestore.Timestamp.now().seconds * 1000)
}

export const calcDistance = (lat1, lon1, lat2, lon2, fixed = 0) => {
    var R = 6371;
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d.toFixed(fixed);
}

export const toRad = (Value) => {
    return Value * Math.PI / 180;
}

export const getUserDetail = (key, user, currentUserSettings, t = {}) => {
    // Ensure currentUserSettings has defaults
    const settings = currentUserSettings || {
        units: {
            lengthType: 'Cm',
            distanceType: 'Km', 
            weightType: 'Kg'
        },
        currentLang: 'de'
    };
    
    const detail = user?.details?.[key] || user?.[key];
    const ethnicities = [
        { key: Ethnicity.Asian, value: 'ASIAN' },
        { key: Ethnicity.Exotic, value: 'EXOTIC' },
        { key: Ethnicity.Ebony, value: 'EBONY' },
        { key: Ethnicity.Caucasian, value: 'CAUCASIAN' },
        { key: Ethnicity.MiddleEast, value: 'MIDDLEEAST' },
        { key: Ethnicity.NativeAmerican, value: 'NATIVEAMERICAN' },
        { key: Ethnicity.Latin, value: 'LATIN' },
        { key: Ethnicity.Eastindian, value: 'EASTINDIAN' },
    ]

    if (key === 'ethnicity') {
        const ethnicity = ethnicities.find(e => e.key === detail);
        return t(ethnicity?.value || detail);
    }

    if (key === 'nationality') {
        const countries = mapCountries(Countries);
        const country = countries.find(c => detail?.code === c.key);
        return t(country?.country || detail?.country || detail);
    }

    if (['height', 'waist', 'hips', 'chest'].includes(key)) {
        if (key === 'chest' && user.gender !== 'Male' && user.details?.chestCup) {
            const value = settings.units?.lengthType === 'Inch'
                ? Math.round(user.details[key]?.inch || 0)
                : Math.round(user.details[key]?.cm || 0);
            return `${value} ${user.details.chestCup}`;
        } else {
            return settings.units?.lengthType === 'Inch'
                ? `${Math.round(user.details[key]?.inch || 0)} inch`
                : `${Math.round(user.details[key]?.cm || 0)} cm`;
        }
    }

    if (key === 'weight') {
        return settings.units?.weightType === 'Lbs'
            ? `${Math.round(user.details[key]?.lbs || 0)} Lbs`
            : `${Math.round(user.details[key]?.kg || 0)} Kg`;
    }

    if (['hairLength', 'hairColor', 'eyeColor'].includes(key)) {
        return t(detail);
    }

    if (key === 'genderLookingFor' && Array.isArray(detail)) {
        // Remove duplicates from array
        const uniqueGenders = Array.from(new Set(detail));
        return uniqueGenders.map(g => {
            if (g === Gender.Male) return t('MALE');
            if (g === Gender.Female) return t('FEMALE');
            if (g === Gender.Transsexual) return t('TRANSSEXUAL');
            return g;
        }).join(', ');
    }

    if (key === 'gender') {
        if (detail === Gender.Male) return t('MALE');
        if (detail === Gender.Female) return t('FEMALE');
        if (detail === Gender.Transsexual) return t('TRANSSEXUAL');
    }

    if (key === 'birthday') {
        const birthday = new Date(detail);
        const ageDifMs = Date.now() - birthday.getTime();
        const ageDate = new Date(ageDifMs);
        return user.fakeAge || Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    return detail;
};

export const mapCountries = (countries) => {
    const source = Array.isArray(countries) ? countries : [];
    const newCountries = [];

    for (let country of source) {
        const name = country?.name || country?.country || '';
        const key = country?.alpha3Code || country?.code || country?.key || '';
        const region = country?.region || '';
        const flag = country?.flag || null;
        newCountries.push({ country: name, key, region, flag });
    }

    return newCountries;
}

