import { Controller, useFieldArray, useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Trash2 } from "lucide-react";
import type { Poll } from "@shared/types";
import { useWatch } from "react-hook-form";
const pollOptionSchema = z.object({
  text: z.string().min(1, "Option text cannot be empty"),
});
const pollSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  poll_type: z.enum(["single", "multiple"]),
  options: z.array(pollOptionSchema).min(2, "At least two options are required"),
  min_selections: z.coerce.number().min(1),
  max_selections: z.coerce.number().min(1),
  is_secret: z.boolean().optional(),
}).refine(data => {
    if (data.poll_type === 'multiple') {
        return data.min_selections <= data.max_selections;
    }
    return true;
}, { message: "Min selections must be less than or equal to max selections", path: ["min_selections"] });
type PollFormData = z.infer<typeof pollSchema>;
interface PollEditorProps {
  poll?: Poll;
  onSave: (data: Poll) => void;
  onCancel: () => void;
  isSaving: boolean;
}
export function PollEditor({ poll, onSave, onCancel, isSaving }: PollEditorProps) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<PollFormData>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      title: poll?.title || "",
      description: poll?.description || "",
      poll_type: poll?.poll_type || "single",
      options: poll?.options || [{ text: "" }, { text: "" }],
      min_selections: poll?.min_selections || 1,
      max_selections: poll?.max_selections || 1,
      is_secret: poll?.is_secret || false,
    },
  });
  const pollType = useWatch({ control, name: "poll_type" });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });
  const onSubmit: SubmitHandler<PollFormData> = (data) => {
    const newPoll: Poll = {
      id: poll?.id || crypto.randomUUID(),
      assembly_id: poll?.assembly_id || "",
      ...data,
      options: data.options.map((opt, index) => ({ id: poll?.options[index]?.id || crypto.randomUUID(), text: opt.text })),
      min_selections: data.poll_type === 'single' ? 1 : data.min_selections,
      max_selections: data.poll_type === 'single' ? 1 : data.max_selections,
      status: poll?.status || 'draft',
      created_at: poll?.created_at || Date.now(),
    };
    onSave(newPoll);
  };
  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>{poll ? "Edit Poll" : "Create New Poll"}</CardTitle>
          <CardDescription>Define the question and options for this poll.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title / Question</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poll_type">Poll Type</Label>
              <Controller
                control={control}
                name="poll_type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select poll type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Choice</SelectItem>
                      <SelectItem value="multiple">Multiple Choice</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_secret">Secret Voting</Label>
              <Controller
                name="is_secret"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2 h-10">
                    <Switch id="is_secret" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="is_secret">Enable</Label>
                  </div>
                )}
              />
            </div>
          </div>
          {pollType === 'multiple' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_selections">Min Selections</Label>
                <Input id="min_selections" type="number" {...register("min_selections")} />
                {errors.min_selections && <p className="text-sm text-red-500">{errors.min_selections.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_selections">Max Selections</Label>
                <Input id="max_selections" type="number" {...register("max_selections")} />
                {errors.max_selections && <p className="text-sm text-red-500">{errors.max_selections.message}</p>}
              </div>
            </div>
          )}
          <div>
            <Label>Options</Label>
            <div className="space-y-2 mt-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`options.${index}.text`)} placeholder={`Option ${index + 1}`} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {errors.options && <p className="text-sm text-red-500">{errors.options.message}</p>}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ text: "" })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSaving ? "Saving..." : "Save Poll"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}