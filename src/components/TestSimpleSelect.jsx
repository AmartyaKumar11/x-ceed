// Test component to verify SimpleSelect works in dialogs
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SimpleSelect from '@/components/ui/simple-select';

export default function TestSimpleSelect() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [selectedAmPm, setSelectedAmPm] = useState('');

  const hourOptions = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
    { value: '6', label: '6' },
    { value: '7', label: '7' },
    { value: '8', label: '8' },
    { value: '9', label: '9' },
    { value: '10', label: '10' },
    { value: '11', label: '11' },
    { value: '12', label: '12' }
  ];

  const minuteOptions = [
    { value: '00', label: '00' },
    { value: '15', label: '15' },
    { value: '30', label: '30' },
    { value: '45', label: '45' }
  ];

  const amPmOptions = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' }
  ];

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)}>
        Test SimpleSelect in Dialog
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test SimpleSelect Component</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Time Selection Test</h3>
              <div className="grid grid-cols-3 gap-2">
                <SimpleSelect
                  value={selectedHour}
                  onValueChange={setSelectedHour}
                  placeholder="Hour"
                  options={hourOptions}
                />
                <SimpleSelect
                  value={selectedMinute}
                  onValueChange={setSelectedMinute}
                  placeholder="Min"
                  options={minuteOptions}
                />
                <SimpleSelect
                  value={selectedAmPm}
                  onValueChange={setSelectedAmPm}
                  placeholder="AM/PM"
                  options={amPmOptions}
                />
              </div>
            </div>

            <div className="p-4 bg-gray-100 rounded">
              <h4 className="font-medium">Selected Values:</h4>
              <p>Hour: {selectedHour || 'None'}</p>
              <p>Minute: {selectedMinute || 'None'}</p>
              <p>AM/PM: {selectedAmPm || 'None'}</p>
              <p>Full Time: {selectedHour && selectedMinute && selectedAmPm 
                ? `${selectedHour}:${selectedMinute} ${selectedAmPm}` 
                : 'Incomplete'}</p>
            </div>

            <Button onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
