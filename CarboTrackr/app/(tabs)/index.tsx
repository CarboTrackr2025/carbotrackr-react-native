import { View, Text, StyleSheet, Image } from "react-native";
import { Dimensions } from "react-native";
import { color } from "../../shared/constants/colors";
import { Reading } from "../../shared/components/Reading";

const { width } = Dimensions.get("window");

//test value
const carboValue = 5000; 
const carboGoalValue = 5000;

type TreeLevel = '1' | '2' | '3' | '4' | '5';

const evaluateCarbohydrate = (carboValue : number): TreeLevel => {
    if (carboValue < carboGoalValue / 5 * 2) return '1';
    if (carboValue < carboGoalValue / 5 * 3) return '2';
    if (carboValue < carboGoalValue / 5 * 4) return '3';
    if (carboValue < carboGoalValue / 5 * 5) return '4';
    if (carboValue = carboGoalValue) return '5'
    return '5'
}

console.log(evaluateCarbohydrate(carboValue))

const getTreeImage = (level: TreeLevel) => {
    const treeImages: Record<TreeLevel, any> = {
        '1': require("../../assets/stage0.png"),
        '2': require("../../assets/stage1.png"),
        '3': require("../../assets/stage2.png"),
        '4': require("../../assets/stage3.png"),
        '5': require("../../assets/stage4.png"),
    };
    
    return treeImages[level];
};

export default function Dashboard() {
    const treeLevel = evaluateCarbohydrate(carboValue);
    const remainingValue = carboGoalValue - carboValue
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Daily Carbohydrate Limit
            </Text>

            <Reading text={remainingValue.toString() + " / " + carboGoalValue.toString()} textStyle={styles.text} unit='g'>

            </Reading>
            <Image
            source={getTreeImage(treeLevel)}
            style={styles.tree}
            resizeMode="contain"
            />              
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 18,
        marginVertical: 10,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },

    textWrap: {
        flex: 1,
        marginRight: 12,
    },

    foodName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        flexShrink: 1,
    },

    subtitle: {
        fontSize: 14,
        color: "#374151",
        marginTop: 6,
    },

    addBtn: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        textAlign: "center",
        fontSize: 22,
        fontWeight: "600",
    },

    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 30,
        paddingVertical: 100,
  },
     border: {
        height: width * 0.6,
        width: width * 0.6,
        borderRadius: 200,
        padding: 2.5,
        justifyContent: "center",
        overflow: "hidden",
    },
    fill: {
        ...StyleSheet.absoluteFillObject,
    },
    defaultFill: {
        backgroundColor: color.white,
    },
    inner: {
        flex: 1,
        borderRadius: 200,
        justifyContent: "center",
        paddingHorizontal: 12,
        overflow: "hidden",
    },
    tree: {
        width: width * 0.8,
        height: width * 0.8,
    },
});