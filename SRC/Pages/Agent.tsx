import { useState, useEffect, useRef } from "react";
import { Header } from "@/Components/Header";
import { Button } from "@/Components/Ui/button";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import backend from "../Lib/backendAdapter";
import { analyzeRisks } from "@/Lib/riskAnalyzer";
import { RiskCategory } from "@/Data/questionnaire";

export default function Agent() {
  const [matricula, setMatricula] = useState("");
  const [validated, setValidated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [carrera, setCarrera] = useState<string | null>(null);
  const [riesgos, setRiesgos] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ sender: 'user'|'agent'; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleValidate = async () => {
    if (!matricula) return;
    setLoading(true);
    try {
      const res = await backend.validateMatricula(matricula);
      if (res.ok && (res.userId || res.body?.id)) {
        setUserId(res.userId || res.body.id);
        setCarrera(res.carrera || res.body.carrera || null);
        setRiesgos(res.riesgos || []);
        setValidated(true);
        // If the user completed the questionnaire earlier, compute hypotheses and save to backend
        try {
          const answersData = localStorage.getItem('udla_answers');
          if (answersData) {
            const answersArray = JSON.parse(answersData) as [string, { text: string; risk?: string; weight?: number }][];
            // Normalize stored answers to the exact shape expected by analyzeRisks
            const normalized: Array<[string, { risk?: RiskCategory; weight?: number }]> = answersArray.map(([k, v]) => [k, { risk: v.risk as RiskCategory | undefined, weight: v.weight }]);
            const answersMap = new Map<string, { risk?: RiskCategory; weight?: number }>(normalized);
            const analysis = analyzeRisks(answersMap);
            // map local risk keys to plugin hypothesis keys
            const mapToPluginKey: Record<string, string> = {
              desorientacion: 'desorientacion_academica',
              economica: 'preocupacion_economica',
              social: 'desconexion_social',
              organizacion: 'dificultad_organizativa',
              tecnologica: 'barreras_tecnologicas',
              entorno: 'entorno_no_propicio',
              baja_preparacion: 'preparacion_academica',
              emocional: 'malestar_emocional'
            };

            const ordered = [analysis.primary, ...analysis.secondary];
            const hipotesis = ordered.map((r) => mapToPluginKey[r] || r);
            if (res.userId || res.body?.id) {
              await backend.saveHypotheses(res.userId || res.body.id, hipotesis, matricula);
            }
          }
        } catch (e) {
          console.warn('No se pudieron guardar hipótesis:', e);
        }
        // Load last conversation if present
        const last = await backend.getLastConversation(matricula);
        if (last.ok && last.conversation) {
          // simple split by new lines to reconstruct messages (best-effort)
          const parts = last.conversation.split('\n').map(s => s.trim()).filter(Boolean);
          const parsed = parts.map(p => ({ sender: p.startsWith('User:') ? 'user' : 'agent', text: p }));
          setMessages(prev => [...prev, ...parsed]);
        }
      } else {
        alert(res.message || res.body?.message || 'Matrícula no encontrada');
      }
    } catch (e) {
      console.error(e);
      alert('Error validando matrícula');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input || !validated) return;
    const text = input.trim();
    setInput("");
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setLoading(true);
    try {
      const res = await backend.sendChatMessage({ userId: userId || undefined, matricula, message: text, riesgos_detectados: riesgos });
      const reply = res.reply || (res.body && JSON.stringify(res.body)) || 'Sin respuesta';
      setMessages(prev => [...prev, { sender: 'agent', text: reply }]);
      // persist conversation (concatenate simple transcript)
      const transcript = messages.concat([{ sender: 'user', text }, { sender: 'agent', text: reply }]).map(m => `${m.sender === 'user' ? 'User' : 'Agent'}: ${m.text}`).join('\n');
      if (userId) await backend.saveConversation(userId, transcript);
    } catch (e) {
      console.error(e);
      alert('Error enviando mensaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header subtitle="Agente de acompañamiento" />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-24 flex flex-col">
        <div className="mb-4">
          <label className="block text-sm text-muted-foreground mb-2">Ingresa tu matrícula / cédula</label>
          <div className="flex gap-2">
            <input
              value={matricula}
              onChange={e => setMatricula(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
              placeholder="Ej. 12345678"
            />
            <Button onClick={handleValidate} disabled={loading}>{loading ? 'Validando...' : 'Validar'}</Button>
          </div>
        </div>

        {validated && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">Conectado como: {carrera || 'Estudiante'}</div>
            <div className="text-xs text-muted-foreground">Riesgos detectados: {riesgos.join(', ') || '—'}</div>
          </div>
        )}

        <div className="flex-1 overflow-auto mb-4" ref={messagesRef} style={{ minHeight: 240 }}>
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground mt-8">No hay mensajes aún. Empieza escribiendo algo.</div>
          )}
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i}>
                <ChatBubble sender={m.sender === 'agent' ? 'agent' : 'user'} message={m.text} />
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background pt-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
              placeholder={validated ? 'Escribe tu mensaje...' : 'Valida tu matrícula primero'}
              disabled={!validated}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            />
            <Button onClick={handleSend} disabled={!validated || loading}>{loading ? 'Enviando...' : 'Enviar'}</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
