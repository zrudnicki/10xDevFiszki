import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Skróty klawiaturowe</DialogTitle>
          <DialogDescription>
            Użyj tych skrótów, aby szybciej poruszać się po fiszkach
          </DialogDescription>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Zamknij</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="font-medium">Spacja</div>
            <div>Odwróć fiszkę</div>
            
            <div className="font-medium">→ lub J</div>
            <div>Oznacz jako przyswojone</div>
            
            <div className="font-medium">← lub K</div>
            <div>Oznacz do powtórki</div>
            
            <div className="font-medium">P</div>
            <div>Wstrzymaj/wznów sesję</div>
            
            <div className="font-medium">Esc</div>
            <div>Wstrzymaj sesję</div>
            
            <div className="font-medium">H</div>
            <div>Pokaż/ukryj pomoc</div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Zamknij</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 