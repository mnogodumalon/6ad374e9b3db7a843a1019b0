/**
 * Technische Klärung abschließen — 5-Schritt-Wizard.
 * Steps: 1) Anfrage wählen → 2) Kritische Punkte & Entscheidungen kontrollieren → 3) Prüfungen, Abweichungen, Risiken dokumentieren
 *        → 4) Übergabeempfänger festlegen → 5) Prüfen & Anfrage auf „technisch geklärt“ setzen.
 * Reads: kundenanfragen, offene_punkte (kritisch & offen), entscheidungen, technischer_abschluss (Duplikat-Check).
 * Writes: technischer_abschluss (create), kundenanfragen (update status) — via useKlaerungAbschliessenFlow. Keine automatische Freigabe.
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { combineFilters, fieldLookup, fieldRef, fieldText, refFilter, useRecordCount } from '@/lib/journey';
import { useKlaerungAbschliessenFlow } from '@/lib/journey/flows/KlaerungAbschliessen';
import { tx } from '@/i18n';

const OPEN_STATES = ['neu', 'zugewiesen', 'in_bearbeitung', 'wartet_auf_kunde', 'wartet_intern', 'zur_entscheidung'];

export default function KlaerungAbschliessenPage() {
  const [step, setStep] = useState(1);
  const flow = useKlaerungAbschliessenFlow({
    steps: {
      kundenanfragen: 1, anfrage: 1,
      anforderungen_geprueft: 2, kritische_punkte_geklaert: 2, entscheidungen_vorhanden: 2, freigaben_vorhanden: 2,
      geprueft_von: 3, verbleibende_abweichungen: 3, verbleibende_risiken: 3, offene_restpunkte: 3,
      uebergabeempfaenger: 4, zusammenfassung: 4,
    },
    items: {
      kundenanfragen: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'anfragenummer') || tx('Anfrage ohne Nummer'),
        subtitle: ctx.ref('kunde'),
        status: fieldLookup(r, 'status') ?? undefined,
      }),
    },
  });

  const abschluss = flow.forms.technischer_abschluss;
  const anfrageId = flow.targets.kundenanfragen.selectedId;
  const enabled = Boolean(anfrageId);

  const kritisch = useRecordCount(flow.port, 'offene_punkte', {
    filter: anfrageId
      ? combineFilters(refFilter('anfrage', anfrageId), tx('r.v_prioritaet == \'kritisch\''), tx`r.v_status in [${OPEN_STATES.map(s => `'${s}'`).join(', ')}]`)
      : undefined,
    where: r => fieldRef(r, 'anfrage') === anfrageId
      && fieldLookup(r, 'prioritaet')?.key === 'kritisch'
      && OPEN_STATES.includes(fieldLookup(r, 'status')?.key ?? ''),
    enabled,
  });
  const entschieden = useRecordCount(flow.port, 'entscheidungen', {
    filter: anfrageId ? combineFilters(refFilter('anfrage', anfrageId), tx('r.v_entscheidungsstatus == \'entschieden\'')) : undefined,
    where: r => fieldRef(r, 'anfrage') === anfrageId && fieldLookup(r, 'entscheidungsstatus')?.key === 'entschieden',
    enabled,
  });
  const vorhanden = useRecordCount(flow.port, 'technischer_abschluss', {
    filter: anfrageId ? refFilter('anfrage', anfrageId) : undefined,
    where: r => fieldRef(r, 'anfrage') === anfrageId,
    enabled,
  });

  const pickProps = flow.pick('kundenanfragen');

  const checkStep2 = (): boolean | string => {
    if (kritisch.count === null || vorhanden.count === null) return tx('Die Prüfung läuft noch — einen Moment bitte.');
    if (kritisch.count > 0) return tx('Kritische offene Punkte sind noch nicht geklärt oder entschieden.');
    if (vorhanden.count > 0) return tx('Für diese Anfrage existiert bereits ein Abschluss.');
    return true;
  };

  return (
    <IntentWizardShell
      title={tx('Technische Klärung abschließen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Voraussetzungen prüfen, Restrisiken und Übergabe festhalten und die Anfrage technisch geklärt setzen.'),
        needs: [tx('Anfragenummer'), tx('Stand der kritischen Punkte'), tx('Name des Übergabeempfängers')],
      }}
    >
      <WizardStep label={tx('Anfrage')} description={tx('Welche Anfrage soll technisch geklärt abgeschlossen werden?')}>
        <EntitySelectStep
          {...flow.picks.kundenanfragen.select}
          {...pickProps}
          onSelect={id => {
            pickProps.onSelect(id);
            abschluss.set('anfrage', id, flow.picks.kundenanfragen.labelOf(id));
          }}
          searchPlaceholder={tx('Anfragenummer suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Kontrolle')} description={tx('Es dürfen keine kritischen Punkte mehr offen sein.')}>
        {!anfrageId ? (
          <StepNav onBack={() => setStep(1)} nextDisabled>{tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}</StepNav>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 space-y-3 overflow-hidden">
              <p className="text-sm text-muted-foreground min-w-0 truncate">
                {tx`Anfrage: ${flow.picks.kundenanfragen.labelOf(anfrageId) ?? ''}`}
              </p>
              {kritisch.count === null ? (
                <p className="text-sm text-muted-foreground">{tx('Kritische Punkte werden geprüft …')}</p>
              ) : kritisch.count > 0 ? (
                <p className="flex items-start gap-2 text-sm text-destructive">
                  <IconAlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <span>{tx`${kritisch.count} kritische Punkte sind noch offen — erst klären oder entscheiden.`}</span>
                </p>
              ) : (
                <p className="flex items-start gap-2 text-sm text-emerald-600">
                  <IconCircleCheck size={18} className="shrink-0 mt-0.5" />
                  <span>{tx('Keine kritischen Punkte offen.')}</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {entschieden.count === null ? tx('Entscheidungen werden gezählt …') : tx`${entschieden.count} Entscheidungen sind getroffen.`}
              </p>
              {vorhanden.count !== null && vorhanden.count > 0 && (
                <p className="flex items-start gap-2 text-sm text-destructive">
                  <IconAlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <span>{tx('Für diese Anfrage existiert bereits ein Abschluss.')}</span>
                </p>
              )}
            </div>
            <Bound form={abschluss} name="anforderungen_geprueft" />
            <Bound form={abschluss} name="kritische_punkte_geklaert" />
            <Bound form={abschluss} name="entscheidungen_vorhanden" />
            <Bound form={abschluss} name="freigaben_vorhanden" />
            <StepNav onBack={() => setStep(1)} onNext={checkStep2} nextStepLabel={tx('Dokumentation')} />
          </div>
        )}
      </WizardStep>

      <WizardStep label={tx('Dokumentation')} description={tx('Was wurde geprüft, was bleibt offen?')} needs={['anfrage']}>
        <div className="space-y-4">
          <Bound form={abschluss} name="geprueft_von" />
          <Bound form={abschluss} name="verbleibende_abweichungen" rows={3} />
          <Bound form={abschluss} name="verbleibende_risiken" rows={3} />
          <Bound form={abschluss} name="offene_restpunkte" rows={3} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Übergabe')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Übergabe')} description={tx('Wer übernimmt die geklärte Anfrage?')} needs={['anfrage']}>
        <div className="space-y-4">
          <Bound form={abschluss} name="uebergabeempfaenger" />
          <Bound form={abschluss} name="zusammenfassung" rows={4} />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'uebergabestatus', label: tx('Übergabestatus'), value: tx('Bereit') },
              { key: 'freigabestatus', label: tx('Technischer Freigabestatus'), value: tx('Nicht freigegeben') },
              { key: 'anfragestatus', label: tx('Neuer Anfragestatus'), value: tx('Technisch geklärt') },
            ]}
            whatHappensNext={tx('Der Abschluss wird dokumentiert und die Anfrage auf „technisch geklärt“ gesetzt. Eine Freigabe erfolgt nicht automatisch.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          submit={flow.submit}
          facts={[
            { label: tx('Übergabestatus'), value: tx('Bereit') },
            { label: tx('Anfragestatus'), value: tx('Technisch geklärt') },
          ]}
          next={[
            { label: tx('Weitere Anfrage abschließen'), onClick: () => { flow.reset(); setStep(1); } },
            { label: tx('Offenen Punkt anlegen'), href: '#/intents/offenen-punkt-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Die technische Freigabe bleibt ein eigener, bewusster Schritt.')}
        />
      )}
    </IntentWizardShell>
  );
}
