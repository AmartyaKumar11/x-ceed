'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";

export default function EducationForm({ onSubmit, onBack, formInstance }) {
  return (
    <form onSubmit={formInstance.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="degree" className="text-sm font-medium">
          Degree/Qualification*
        </label>
        <input
          id="degree"
          type="text"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Bachelor's in Computer Science"
          {...formInstance.register("degree")}
        />
        {formInstance.formState.errors.degree && (
          <p className="text-sm font-medium text-destructive">
            {formInstance.formState.errors.degree.message}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="institution" className="text-sm font-medium">
          Institution*
        </label>
        <input
          id="institution"
          type="text"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="University/School Name"
          {...formInstance.register("institution")}
        />
        {formInstance.formState.errors.institution && (
          <p className="text-sm font-medium text-destructive">
            {formInstance.formState.errors.institution.message}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="edu-address" className="text-sm font-medium">
          Institution Address*
        </label>
        <input
          id="edu-address"
          type="text"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Institution Address"
          {...formInstance.register("address")}
        />
        {formInstance.formState.errors.address && (
          <p className="text-sm font-medium text-destructive">
            {formInstance.formState.errors.address.message}
          </p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium">Start Date*</label>
        <SimpleDatePicker
          selected={formInstance.watch("startDate")} 
          onSelect={(date) => {
            formInstance.setValue("startDate", date);
            // If end date is before start date, clear end date
            const endDate = formInstance.getValues('endDate');
            if (endDate && date && endDate < date) {
              formInstance.setValue('endDate', null);
            }
          }}
        />
        {formInstance.formState.errors.startDate && (
          <p className="text-sm font-medium text-destructive">
            {formInstance.formState.errors.startDate.message}
          </p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium">End Date (or Expected)</label>
        <SimpleDatePicker
          selected={formInstance.watch("endDate")} 
          onSelect={(date) => {
            const startDate = formInstance.getValues('startDate');
            // Only allow setting end date if it's after start date
            if (!startDate || date >= startDate) {
              formInstance.setValue("endDate", date);
            } else {
              formInstance.setError('endDate', {
                type: 'manual',
                message: 'End date must be after start date'
              });
            }
          }}
        />
        {formInstance.formState.errors.endDate && (
          <p className="text-sm font-medium text-destructive">
            {formInstance.formState.errors.endDate.message}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="grade" className="text-sm font-medium">
          Grade/CGPA
        </label>
        <input
          id="grade"
          type="text"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="e.g. 3.8/4.0"
          {...formInstance.register("grade")}
        />
      </div>
      
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button type="submit" className="flex-1">Continue</Button>
      </div>
    </form>
  );
}
