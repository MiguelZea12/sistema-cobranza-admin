import { adminDb } from '@/lib/firebase/admin';
import { Cobrador } from '@/lib/types';

export class CobradorService {
  private collection = 'cobradores';

  private getDb() {
    return adminDb();
  }

  // Obtener todos los cobradores desde Firebasee
  async getAllCobradores(periodo: string): Promise<Cobrador[]> {
    try {
      const snapshot = await this.getDb()
        .collection(this.collection)
        .where('periodo', '==', periodo)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Cobrador));
    } catch (error) {
      console.error('Error obteniendo cobradores:', error);
      throw error;
    }
  }

  // Obtener un cobrador por ID
  async getCobradorById(id: string): Promise<Cobrador | null> {
    try {
      const doc = await this.getDb().collection(this.collection).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as Cobrador;
    } catch (error) {
      console.error('Error obteniendo cobrador:', error);
      throw error;
    }
  }

  // Crear o actualizar un cobrador en Firebase
  async saveCobrador(cobrador: Partial<Cobrador>, id?: string): Promise<string> {
    try {
      const data = {
        ...cobrador,
        updatedAt: new Date(),
      };

      if (id) {
        await this.getDb().collection(this.collection).doc(id).update(data);
        return id;
      } else {
        const docRef = await this.getDb().collection(this.collection).add({
          ...data,
          createdAt: new Date(),
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error guardando cobrador:', error);
      throw error;
    }
  }

  // Eliminar un cobrador de Firebase
  async deleteCobrador(id: string): Promise<void> {
    try {
      await this.getDb().collection(this.collection).doc(id).delete();
    } catch (error) {
      console.error('Error eliminando cobrador:', error);
      throw error;
    }
  }
}
