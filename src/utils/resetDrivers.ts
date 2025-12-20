import { collection, getDocs, updateDoc, doc, writeBatch, deleteField, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Função para resetar todos os cadastros de motoristas no Firebase
 * Mantém os dados mas remove as vinculações (uid, googleUid, email) para permitir novo cadastro
 */
export const resetAllDrivers = async (): Promise<{ success: boolean; message: string; resetCount: number }> => {
  try {
    console.log("Iniciando reset de cadastros de motoristas...");
    
    const driversRef = collection(db, "motoristas_pre_aprovados");
    const snapshot = await getDocs(driversRef);
    
    if (snapshot.empty) {
      return {
        success: true,
        message: "Nenhum motorista encontrado para resetar.",
        resetCount: 0,
      };
    }

    // Processar em batches de 500 (limite do Firebase)
    const allDocs = snapshot.docs;
    let resetCount = 0;
    const batchSize = 500;

    for (let i = 0; i < allDocs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = allDocs.slice(i, i + batchSize);

      batchDocs.forEach((docSnapshot) => {
        const driverData = docSnapshot.data();
        
        // Verificar se há dados para manter
        const dataToKeep: any = {
          name: driverData.name || "",
          phone: driverData.phone || "",
          hub: driverData.hub || "",
          vehicleType: driverData.vehicleType || "",
          birthDate: driverData.birthDate || "",
          avatar: driverData.avatar || "",
          shopeeId: driverData.shopeeId || docSnapshot.id,
          status: driverData.status || "DISPONIVEL",
          availability: driverData.availability !== undefined ? driverData.availability : true,
        };

        // Manter timestamp de criação se existir
        if (driverData.createdAt) {
          dataToKeep.createdAt = driverData.createdAt;
        }

        // Atualizar documento removendo uid, googleUid e email
        const driverRef = doc(db, "motoristas_pre_aprovados", docSnapshot.id);
        batch.update(driverRef, {
          ...dataToKeep,
          uid: deleteField(),
          googleUid: deleteField(),
          email: deleteField(),
        });

        resetCount++;
      });

      // Commitar o batch
      await batch.commit();
      console.log(`Batch processado: ${resetCount} motorista(s) resetado(s) até agora...`);
    }

    console.log(`Reset concluído! ${resetCount} motorista(s) resetado(s).`);

    return {
      success: true,
      message: `Reset concluído com sucesso! ${resetCount} motorista(s) resetado(s).`,
      resetCount,
    };
  } catch (error: any) {
    console.error("Erro ao resetar motoristas:", error);
    return {
      success: false,
      message: `Erro ao resetar: ${error.message}`,
      resetCount: 0,
    };
  }
};

/**
 * Função para resetar um motorista específico por ID
 */
export const resetDriverById = async (driverId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const driverRef = doc(db, "motoristas_pre_aprovados", driverId);
    const driverDocSnap = await getDoc(driverRef);
    
    if (!driverDocSnap.exists()) {
      return {
        success: false,
        message: "Motorista não encontrado.",
      };
    }

    const driverData = driverDocSnap.data();
    
    // Manter dados importantes
    const dataToKeep: any = {
      name: driverData.name || "",
      phone: driverData.phone || "",
      hub: driverData.hub || "",
      vehicleType: driverData.vehicleType || "",
      birthDate: driverData.birthDate || "",
      avatar: driverData.avatar || "",
      shopeeId: driverData.shopeeId || driverId,
      status: driverData.status || "DISPONIVEL",
      availability: driverData.availability !== undefined ? driverData.availability : true,
    };

    // Manter timestamp de criação se existir
    if (driverData.createdAt) {
      dataToKeep.createdAt = driverData.createdAt;
    }

    // Remover vinculações usando deleteField
    await updateDoc(driverRef, {
      ...dataToKeep,
      uid: deleteField(),
      googleUid: deleteField(),
      email: deleteField(),
    });

    return {
      success: true,
      message: "Motorista resetado com sucesso!",
    };
  } catch (error: any) {
    console.error("Erro ao resetar motorista:", error);
    return {
      success: false,
      message: `Erro ao resetar: ${error.message}`,
    };
  }
};
