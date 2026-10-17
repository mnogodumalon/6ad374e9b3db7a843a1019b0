/**
 * Rückfrage vorbereiten — 6-Schritt-Wizard.
 * Steps: 1) Offenen Punkt wählen → 2) Anfrage (Status) wählen → 3) Anfrage der Nachricht wählen
 *        → 4) Weitere Punkte desselben Empfängers bündeln → 5) Nachricht formulieren → 6) Prüfen & Entwurf speichern.
 * Reads: offene_punkte, kundenanfragen. Writes: rueckfragen_und_kommunikation (Entwurf, nicht versendet),
 * offene_punkte (wartet auf Kunde), kundenanfragen (Rückfragen offen) — alles über useRueckfrageVorbereitenFlow.
 * Composes: IntentWizardShell, EntitySelectStep, Field, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useRueckfrageVorbereitenFlow } from '@/lib/journey/flows/RueckfrageVorbereiten';
import { tx } from '@/i18n';

export default function RueckfrageVorbereitenPage() {
  const [step, setStep] = useState(1);
  const flow = useRueckfrageVorbereitenFlow({
    steps: {
      offene_punkte: 1,
      kundenanfragen: 2,
      anfrage: 3,
      zugehoerige_offene_punkte: 4,
      kanal: 5,
      absender: 5,
      empfaenger: 5,
      betreff: 5,
      inhalt: 5,
      antwort_erwartet_bis: 5,
    },
    items: {
      offene_punkte: r => ({
        id: r.id,
        title: fieldText(r, 'kurztitel'),
        subtitle: fieldLookup(r, 'prioritaet')?.label,
      }),
      zugehoerige_offene_punkte: r => ({
        id: r.id,
        title: fieldText(r, 'kurztitel'),
        subtitle: fieldLookup(r, 'prioritaet')?.label,
      }),
      kundenanfragen: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'anfragenummer'),
        subtitle: ctx.ref('kunde'),
      }),
      anfrage: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'anfragenummer'),
        subtitle: ctx.ref('kunde'),
      }),
    },
  });
  const kommunikation = flow.forms.rueckfragen_und_kommunikation;

  return (
    <IntentWizardShell
      title={tx('Rückfrage vorbereiten')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Offene Punkte zu einem Nachrichtenentwurf an den Kunden bündeln.'),
        needs: [tx('Ein offener Punkt'), tx('Empfänger und Betreff')],
      }}
    >
      <WizardStep label={tx('Offener Punkt')} description={tx('Wähle den offenen Punkt, zu dem du den Kunden fragen willst.')}>
        <EntitySelectStep
          {...flow.picks.offene_punkte.select}
          {...flow.pick('offene_punkte')}
          searchPlaceholder={tx('Kurztitel suchen …')}
        />
      </WizardStep>
      <WizardStep label={tx('Anfrage')} description={tx('Zu welcher Kundenanfrage gehört die Rückfrage? Ihr Status springt auf „Rückfragen offen“.')}>
        <EntitySelectStep
          {...flow.picks.kundenanfragen.select}
          {...flow.pick('kundenanfragen')}
          searchPlaceholder={tx('Anfragenummer suchen …')}
        />
      </WizardStep>
      <WizardStep label={tx('Bezug')} description={tx('Bestätige die Anfrage, der die Nachricht zugeordnet wird.')}>
        <EntitySelectStep
          {...flow.picks.anfrage.select}
          {...flow.pick('anfrage')}
          searchPlaceholder={tx('Anfragenummer suchen …')}
        />
      </WizardStep>
      <WizardStep label={tx('Punkte bündeln')} description={tx('Wähle alle offenen Punkte, die in dieser Nachricht gefragt werden.')}>
        <div className="space-y-4">
          <Field form={kommunikation} name="zugehoerige_offene_punkte">
            <EntitySelectStep
              {...flow.picks.zugehoerige_offene_punkte.select}
              {...flow.pickMany('zugehoerige_offene_punkte')}
              searchPlaceholder={tx('Kurztitel suchen …')}
            />
          </Field>
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => flow.validateStep(4)}
            nextStepLabel={tx('Nachricht formulieren')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Nachricht')} description={tx('Formuliere Betreff, Inhalt und Empfänger. Der Entwurf wird nicht versendet.')}>
        <div className="space-y-4">
          <Bound form={kommunikation} name="kanal" />
          <Bound form={kommunikation} name="absender" />
          <Bound form={kommunikation} name="empfaenger" />
          <Bound form={kommunikation} name="betreff" />
          <Bound form={kommunikation} name="inhalt" rows={8} />
          <Bound form={kommunikation} name="antwort_erwartet_bis" />
          <StepNav
            onBack={() => setStep(4)}
            onNext={() => flow.validateStep(5)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'versandstatus', label: tx('Versandstatus'), value: tx('Entwurf (nicht versendet)') },
              { key: 'punktestatus', label: tx('Status der Punkte'), value: tx('Wartet auf Kunde') },
            ]}
            whatHappensNext={tx('Der Entwurf wird gespeichert, nichts wird versendet. Der Punkt wartet danach auf den Kunden.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          whatHappensNext={tx('Prüfe den Entwurf und versende ihn selbst. Sobald die Antwort da ist, ordne sie zu.')}
          next={[
            { label: tx('Antwort zuordnen'), href: '#/intents/antwort-zuordnen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
