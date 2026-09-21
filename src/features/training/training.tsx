import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Send,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { machines, trainingOfferings } from "@/data/portal-data";

export function Training({ accountId }: { accountId: string }) {
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const accountMachineIds = machines
    .filter((machine) => machine.accountId === accountId)
    .map((machine) => machine.id);
  const offerings = trainingOfferings.filter(
    (offering) =>
      offering.compatibleMachineIds.length === 0 ||
      offering.compatibleMachineIds.some((machineId) =>
        accountMachineIds.includes(machineId),
      ),
  );

  function requestTraining(id: string) {
    setRequestedIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Training</h1>
        <p className="max-w-2xl text-muted-foreground"></p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <GraduationCap className="size-6 text-primary" />
            <p className="mt-4 text-4xl font-semibold">{offerings.length}</p>
            <p className="text-sm text-muted-foreground">Catalogue offerings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <BookOpen className="size-6 text-primary" />
            <p className="mt-4 text-4xl font-semibold">
              {
                offerings.filter(
                  (offering) => offering.availability === "requestable",
                ).length
              }
            </p>
            <p className="text-sm text-muted-foreground">Requestable now</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Send className="size-6 text-primary" />
            <p className="mt-4 text-4xl font-semibold">{requestedIds.length}</p>
            <p className="text-sm text-muted-foreground">Simulated requests</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {offerings.map((offering) => {
          const relatedMachines = machines.filter((machine) =>
            offering.compatibleMachineIds.includes(machine.id),
          );
          const requested = requestedIds.includes(offering.id);
          return (
            <Card key={offering.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg">{offering.title}</CardTitle>
                  <Badge
                    variant={
                      offering.availability === "unavailable"
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {offering.availability === "unavailable"
                      ? "Unavailable"
                      : "Requestable"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                <p className="text-sm text-muted-foreground">
                  {offering.description}
                </p>
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Audience</dt>
                    <dd className="font-medium">{offering.audience}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Format</dt>
                    <dd className="font-medium">{offering.format}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      Equipment relevance
                    </dt>
                    <dd className="font-medium">
                      {relatedMachines.length > 0
                        ? relatedMachines
                            .map((machine) => machine.name)
                            .join(", ")
                        : "No equipment relevance defined yet"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-auto pt-2">
                  <Button
                    variant={requested ? "secondary" : "default"}
                    disabled={
                      offering.availability === "unavailable" || requested
                    }
                    onClick={() => requestTraining(offering.id)}
                  >
                    {requested ? (
                      <>
                        <CheckCircle2 className="mr-2 size-4" />
                        Request noted
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 size-4" />
                        Request training
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {offerings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No training offerings are currently relevant to this account.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
