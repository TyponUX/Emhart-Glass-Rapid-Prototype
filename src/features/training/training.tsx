import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trainingOfferings } from "@/data/portal-data";

export function Training({ accountId: _accountId }: { accountId: string }) {
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [topicFilter, setTopicFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateSort, setDateSort] = useState<"upcoming" | "latest">("upcoming");
  const topics = [...new Set(trainingOfferings.map((offering) => offering.topic))];
  const locations = [...new Set(trainingOfferings.map((offering) => offering.location))];
  const offerings = useMemo(() => trainingOfferings
    .filter((offering) => topicFilter === "all" || offering.topic === topicFilter)
    .filter((offering) => locationFilter === "all" || offering.location === locationFilter)
    .sort((first, second) => {
      const difference = new Date(first.date).getTime() - new Date(second.date).getTime();
      return dateSort === "upcoming" ? difference : -difference;
    }), [dateSort, locationFilter, topicFilter]);

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
  }

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
      <Card className="bg-action-panel-color">
        <CardHeader><CardTitle className="text-base">Find a training course</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="training-topic">Topic</Label>
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger id="training-topic"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All topics</SelectItem>{topics.map((topic) => <SelectItem key={topic} value={topic}>{topic}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="training-location">Location</Label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger id="training-location"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All locations</SelectItem>{locations.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="training-date-sort">Date</Label>
            <Select value={dateSort} onValueChange={(value) => setDateSort(value as "upcoming" | "latest")}>
              <SelectTrigger id="training-date-sort"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="upcoming">Soonest first</SelectItem><SelectItem value="latest">Latest first</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        {offerings.map((offering) => {
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
                    <dt className="text-muted-foreground">Topic</dt>
                    <dd className="font-medium">{offering.topic}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="font-medium">{formatDate(offering.date)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="font-medium">{offering.location}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Audience</dt>
                    <dd className="font-medium">{offering.audience}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Format</dt>
                    <dd className="font-medium">{offering.format}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Equipment relevance</dt>
                    <dd className="font-medium">Catalogue course</dd>
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
