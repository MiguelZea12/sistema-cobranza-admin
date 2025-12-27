import { adminDb } from '@/lib/firebase/admin';
import { Usuario } from '@/lib/types';

export class UsuarioService {
  private usuariosCollection = 'usuarios';

  private getDb() {
    return adminDb();
  }

  // Obtener todos los usuarios desde Firebase
  async getAllUsuarios(): Promise<Usuario[]> {
    try {
      const snapshot = await this.getDb().collection(this.usuariosCollection).get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Usuario));
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  // Obtener un usuario por ID
  async getUsuarioById(id: string): Promise<Usuario | null> {
    try {
      const doc = await this.getDb().collection(this.usuariosCollection).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as Usuario;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  // Crear o actualizar un usuario en Firebase
  async saveUsuario(usuario: Partial<Usuario>, id?: string): Promise<string> {
    try {
      const data = {
        ...usuario,
        updatedAt: new Date(),
      };

      if (id) {
        await this.getDb().collection(this.usuariosCollection).doc(id).update(data);
        return id;
      } else {
        const docRef = await this.getDb().collection(this.usuariosCollection).add({
          ...data,
          createdAt: new Date(),
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error guardando usuario:', error);
      throw error;
    }
  }

  // Eliminar un usuario de Firebase
  async deleteUsuario(id: string): Promise<void> {
    try {
      await this.getDb().collection(this.usuariosCollection).doc(id).delete();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }
}
