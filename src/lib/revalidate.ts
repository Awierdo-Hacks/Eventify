import 'server-only';
import { revalidatePath } from 'next/cache';

/** Refresh every signed-in area after a change that both parties can see. */
export function revalidateApp() {
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/provider-dashboard', 'layout');
  revalidatePath('/messages', 'layout');
  revalidatePath('/admin', 'layout');
}
