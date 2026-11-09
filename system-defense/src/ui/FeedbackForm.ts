import { deviceInfo, MAX_LENGTH, sendFeedback, type FeedbackContext, type SendResult } from '../feedback';
import { lang, t } from '../i18n';

/** Game data for the email; version, language and device are added here. */
export type FeedbackGameInfo = Pick<FeedbackContext, 'level' | 'wave' | 'result'>;

export interface FeedbackFormOptions {
  getGameInfo(): FeedbackGameInfo;
  /** Label and action of the button shown after sending ("Close", "Back to menu"). */
  doneLabel: string;
  onDone(): void;
}

/** The text being written survives a redraw (language switch, closing and opening again). */
let draft = '';

function message(result: SendResult): string {
  switch (result) {
    case 'tooShort':
      return t('Write at least 5 characters.', 'Escribe al menos 5 caracteres.');
    case 'tooLong':
      return t(`Use at most ${MAX_LENGTH} characters.`, `Usa como máximo ${MAX_LENGTH} caracteres.`);
    case 'wait':
      return t('You just sent a message. Try again in a minute.', 'Acabas de enviar un mensaje. Inténtalo en un minuto.');
    case 'error':
      return t('Could not send. Try again in a minute.', 'No se pudo enviar. Inténtalo en un minuto.');
    case 'sent':
      return t('Thanks! Your message was sent.', '¡Gracias! Tu mensaje se envió.');
  }
}

/**
 * Feedback form: one text field and Send. Used on the Feedback screen of the home
 * view, and over the game from the pause and end screens.
 */
export function mountFeedbackForm(container: HTMLElement, opts: FeedbackFormOptions): void {
  container.innerHTML = `
    <form class="feedback" novalidate>
      <p class="feedback-intro">${t('Found a bug? Have an idea? Tell us anything.', '¿Has encontrado un bug? ¿Tienes una idea? Cuéntanos lo que quieras.')}</p>
      <textarea name="message" rows="5" maxlength="${MAX_LENGTH}" aria-label="${t('Your message', 'Tu mensaje')}" placeholder="${t('Write your message here…', 'Escribe tu mensaje aquí…')}"></textarea>
      <input class="feedback-trap" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="feedback-foot">
        <button class="btn primary" type="submit">${t('Send', 'Enviar')}</button>
        <span class="feedback-count"></span>
      </div>
      <p class="feedback-status" role="status"></p>
      <p class="feedback-note">${t('Includes game version and device info.', 'Incluye la versión del juego y datos del dispositivo.')}</p>
    </form>`;
  const form = container.querySelector('form')!;
  const text = form.querySelector('textarea')!;
  const trap = form.querySelector<HTMLInputElement>('.feedback-trap')!;
  const send = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const count = form.querySelector<HTMLElement>('.feedback-count')!;
  const status = form.querySelector<HTMLElement>('.feedback-status')!;

  const updateCount = () => {
    count.textContent = `${text.value.length}/${MAX_LENGTH}`;
  };
  text.value = draft;
  updateCount();
  text.addEventListener('input', () => {
    draft = text.value;
    updateCount();
    status.textContent = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (send.disabled) return;
    send.disabled = true;
    send.textContent = t('Sending…', 'Enviando…');
    status.className = 'feedback-status';
    const ctx: FeedbackContext = { version: __APP_VERSION__, language: lang(), ...opts.getGameInfo(), ...deviceInfo() };
    const result = await sendFeedback(text.value, ctx, trap.value);
    if (!container.contains(form)) return; // closed or redrawn while sending
    if (result === 'sent') {
      draft = '';
      form.innerHTML = `<p class="feedback-status ok" role="status">${message(result)}</p>
        <div class="feedback-foot"><button class="btn primary" type="button">${opts.doneLabel}</button></div>`;
      const done = form.querySelector<HTMLButtonElement>('button')!;
      done.addEventListener('click', () => opts.onDone());
      done.focus({ preventScroll: true });
      return;
    }
    send.disabled = false;
    send.textContent = t('Send', 'Enviar');
    status.className = 'feedback-status warn';
    status.textContent = message(result);
  });
}

/** Focuses the text field (after the form is shown). */
export function focusFeedback(container: HTMLElement): void {
  container.querySelector<HTMLTextAreaElement>('.feedback textarea')?.focus({ preventScroll: true });
}
