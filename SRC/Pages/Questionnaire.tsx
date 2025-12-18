import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/Components/Ui/button";
import { Chip } from "@/Components/Ui/chip";
import { ProgressBar } from "@/Components/ProgressBar";
import { questionnaireData, Question, QuestionOption } from "@/Data/questionnaire";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function Questionnaire() {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, { text: string; risk?: string; weight?: number }>>(new Map());
  const [history, setHistory] = useState<number[]>([]);

  const currentQuestion = questionnaireData[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion.id);

  const handleAnswer = (option: QuestionOption) => {
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, {
      text: option.text,
      risk: option.risk,
      weight: option.weight,
    });
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (!currentAnswer) return;

    // Save current position to history
    setHistory([...history, currentQuestionIndex]);

    // Check for conditional logic
    if (currentQuestion.condition && currentQuestion.id === currentQuestion.condition.questionId) {
      const shouldTrigger = currentQuestion.condition.answers.includes(currentAnswer.text);
      
      if (shouldTrigger && currentQuestion.condition.skipTo) {
        // Go to specific question
        const nextIndex = questionnaireData.findIndex(q => q.id === currentQuestion.condition!.skipTo);
        if (nextIndex !== -1) {
          setCurrentQuestionIndex(nextIndex);
          return;
        }
      } else if (!shouldTrigger) {
        // Skip to P3 if condition not met
        const p3Index = questionnaireData.findIndex(q => q.id === 'P3');
        if (p3Index !== -1) {
          setCurrentQuestionIndex(p3Index);
          return;
        }
      }
    }

    // Move to next question
    if (currentQuestionIndex < questionnaireData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Finished - save answers and navigate to summary
      localStorage.setItem("udla_answers", JSON.stringify(Array.from(answers.entries())));
      navigate("/summary");
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const previousIndex = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentQuestionIndex(previousIndex);
    } else {
      navigate("/home");
    }
  };

  const renderOptions = () => {
    if (currentQuestion.type === 'chips' && currentQuestion.options.length <= 3) {
      return (
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => (
            <Chip
              key={idx}
              onClick={() => handleAnswer(option)}
              selected={currentAnswer?.text === option.text}
              className="w-full justify-center"
            >
              {option.text}
            </Chip>
          ))}
        </div>
      );
    }

    // List for > 3 options or type === 'list'
    return (
      <div className="space-y-2">
        {currentQuestion.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              currentAnswer?.text === option.text
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent"
            }`}
          >
            <span className="text-sm">{option.text}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-muted-foreground">Caracterización</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-7 text-xs"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Volver
              </Button>
            </div>
          </div>
          <ProgressBar 
            current={currentQuestionIndex + 1} 
            total={questionnaireData.length} 
          />
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold leading-relaxed whitespace-pre-line">
            {currentQuestion.text}
          </h2>
        </div>

        {renderOptions()}

        <p className="text-xs text-muted-foreground text-center mt-6">
          Puedes volver atrás • Toma ~2 minutos
        </p>
      </main>

      <footer className="sticky bottom-0 bg-background border-t px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            size="lg"
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleNext}
            disabled={!currentAnswer}
            size="lg"
            className="flex-1"
          >
            {currentQuestionIndex === questionnaireData.length - 1 ? "Finalizar" : "Siguiente"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
