import { CreateEventForm } from "./create-event-form";

export default function NewEventPage() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-4xl font-extrabold tracking-tight">Create a Bet</h1>
      <p className="mb-8 mt-2 text-body">Describe your bet in plain English. AI will structure it for you.</p>
      <CreateEventForm />
    </div>
  );
}
