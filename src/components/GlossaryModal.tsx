import React, { useState } from 'react';
import { BookOpen, Search, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface GlossaryItem {
  term: string;
  category: 'Data Science' | 'Statistica' | 'Machine Learning';
  definition: string;
  example: string;
}

const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'Feature (Caratteristica)',
    category: 'Data Science',
    definition: 'Una variabile o proprietà misurabile di un oggetto (es. lunghezza orecchie, regolarità baffi, peso). Le feature sono gli input usati dal modello per fare previsioni.',
    example: 'Se osserviamo un gatto, le orecchie appuntite (85%) e i lunghi baffi (90%) sono due feature numeriche.',
  },
  {
    term: 'Label (Etichetta / Classe Target)',
    category: 'Machine Learning',
    definition: 'La risposta corretta o categoria che il modello deve imparare a prevedere (es. Gatto, Cane, Altro). Nell\'apprendimento supervisionato le label sono fornite durante il training.',
    example: 'Ogni riga del nostro dataset ha le feature visive e la label corrispondente ("GATTO").',
  },
  {
    term: 'Dataset Train vs Test',
    category: 'Machine Learning',
    definition: 'Suddivisione dei dati in due gruppi indipendenti: il set di Addestramento (Train) serve al modello per imparare; il set di Collaudo (Test) serve a verificare come si comporta su dati MAI visti prima.',
    example: 'Se usiamo l\'80% per Train e il 20% per Test, controlliamo se il modello ha imparato i concetti o ha solo memorizzato.',
  },
  {
    term: 'Media vs Mediana',
    category: 'Statistica',
    definition: 'La Media è la somma dei valori divisa per il numero totale. La Mediana è il valore centrale che divide la distribuzione a metà. La mediana è robusta contro gli outlier!',
    example: 'Se 5 gatti pesano [3, 4, 4, 5, 20] kg: la mediana è 4 kg (rappresentativa), mentre la media salta a 7.2 kg a causa del peso anomalo (outlier).',
  },
  {
    term: 'Deviazione Standard (σ) e Varianza',
    category: 'Statistica',
    definition: 'Misurano la dispersione dei dati attorno alla media. Se la deviazione standard è bassa, i dati sono raggruppati vicini alla media; se è alta, i dati sono molto sparpagliati.',
    example: 'Nei gatti di razza le orecchie sono tutte attorno all\'80% (σ bassa = 5%), mentre negli "altri animali" i tratti variano tantissimo (σ alta = 25%).',
  },
  {
    term: 'Outlier (Valore Anomalo)',
    category: 'Data Science',
    definition: 'Un dato che si discosta marcatamente dal resto del gruppo. Può derivare da un errore di misura, un rumore nel sensore o un caso eccezionale nel mondo reale.',
    example: 'Un presunto gatto con orecchie allo 0% e peso di 50kg è con ogni probabilità un errore di inserimento da pulire.',
  },
  {
    term: 'Correlazione di Pearson (r)',
    category: 'Statistica',
    definition: 'Un numero compreso tra -1 e +1 che misura quanto due variabili variano insieme in modo lineare. +1 significa correlazione positiva perfetta, 0 nessuna correlazione, -1 correlazione inversa.',
    example: 'Se r = 0.82 tra orecchie e baffi, all\'aumentare della vistosità delle orecchie quasi sempre aumentano anche i baffi.',
  },
  {
    term: 'Normalizzazione (Min-Max e Z-Score)',
    category: 'Data Science',
    definition: 'Tecnica per portare tutte le feature su una scala numerica comparabile, evitando che una feature con numeri enormi (es. peso in grammi) schiacci feature con numeri piccoli.',
    example: 'Il Min-Max riscala i valori tra 0 e 1. Lo Z-score centra i dati sulla media zero con deviazione standard unitaria.',
  },
  {
    term: 'k-Nearest Neighbors (k-NN)',
    category: 'Machine Learning',
    definition: 'Algoritmo intuitivo e potente: per classificare un nuovo punto, trova i "k" vicini più vicini nello spazio delle caratteristiche e assegna la classe più votata.',
    example: 'Se con k=3 un nuovo animale ha 2 vicini gatti e 1 cane, l\'algoritmo lo classifica come Gatto!',
  },
  {
    term: 'Confine di Decisione (Decision Boundary)',
    category: 'Machine Learning',
    definition: 'La frontiera geometrica che separa le regioni dello spazio predette per ciascuna classe. Mappa l\'intero territorio in "zone di influenza".',
    example: 'Sulla nostra mappa 2D, lo sfondo colorato mostra in anteprima quale classe verrebbe assegnata in ogni punto.',
  },
  {
    term: 'Matrice di Confusione',
    category: 'Machine Learning',
    definition: 'Una tabella a doppia entrata (Classi Reali vs Classi Predette). Mostra sia le predizioni corrette (diagonale) sia gli errori specifici commessi dal modello.',
    example: 'Permette di scoprire: "Il modello confonde spesso i gatti con gli altri animali, ma non scambia mai i cani con i gatti!".',
  },
  {
    term: 'Overfitting vs Underfitting',
    category: 'Machine Learning',
    definition: 'Overfitting: il modello impara a memoria il dataset di training (inclusi difetti e rumore) e sbaglia sul test set. Underfitting: il modello è troppo semplice e non cattura i pattern di base.',
    example: 'Con k=1 nel k-NN, il modello crea piccole isole bizzarre per ogni singolo punto anomalo (Overfitting). Con k=5 ottiene confini regolari e generali.',
  },
  {
    term: 'Bias / Pregiudizio Algoritmico',
    category: 'Data Science',
    definition: 'Distorsione sistematica che nasce da un dataset sbilanciato o non rappresentativo. Il modello tenderà a favorire la classe maggioritaria.',
    example: 'Se addestri con 100 cani e solo 2 gatti, l\'IA imparerà a indovinare sempre "Cane" per massimizzare la precisione apparente, ignorando i gatti!',
  },
  {
    term: 'Iperparametri (Epochs, Batch, Learning Rate)',
    category: 'Machine Learning',
    definition: 'Manopole di regolazione impostate prima dell\'addestramento: le Epoche indicano quante volte il modello rivede i dati, la Batch Size il raggruppamento dei dati, il Learning Rate la velocità dei passi.',
    example: 'Un learning rate troppo alto fa oscillare l\'errore (Loss); troppo basso richiede troppe epoche.',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const GlossaryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tutti');

  if (!isOpen) return null;

  const categories = ['Tutti', 'Data Science', 'Statistica', 'Machine Learning'];

  const filtered = GLOSSARY_ITEMS.filter(item => {
    const matchesSearch =
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.example.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = activeCategory === 'Tutti' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border-4 border-blue-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-black">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Dizionario Didattico: Data Science &amp; ML</h2>
              <p className="text-xs text-blue-200">Guida rapida ai concetti fondamentali per studenti e docenti</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cerca un termine, formula o concetto (es. Media, Outlier, k-NN, Bias)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-inner"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                  activeCategory === cat
                    ? 'bg-blue-800 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-semibold">
              Nessun termine corrisponde alla ricerca.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.term}
                className="p-4 bg-slate-50 hover:bg-blue-50/50 border-2 border-slate-200 hover:border-blue-300 rounded-2xl transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {item.term}
                  </h3>
                  <span className="text-[11px] font-black font-mono px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {item.definition}
                </p>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                  <span className="text-blue-700 font-black shrink-0">💡 Esempio:</span>
                  <span>{item.example}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-800 hover:bg-blue-900 text-white font-extrabold text-sm rounded-xl transition shadow"
          >
            Chiudi Dizionario
          </button>
        </div>

      </div>
    </div>
  );
};
