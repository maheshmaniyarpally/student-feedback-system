# ...existing code...
from django.core.management.base import BaseCommand
from api.models import Mentor


class Command(BaseCommand):
    help = 'Adds multiple mentors to the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Delete all existing mentors before adding the list (use with caution).'
        )

    def handle(self, *args, **options):
        if options.get('force'):
            Mentor.objects.all().delete()
            self.stdout.write(self.style.WARNING('Deleted all existing mentors'))
        mentors_to_add = [
            'M AJAY',
            'KARTHIK',
            'VINOD',
            'prathap',
            'MAHESH',
            'sai nithin',
            'venkat',
            'Hari chandhana',
            'Spandana',
            'Meghana',
        ]

        added_count = 0
        skipped_count = 0

        for mentor_name in [m.strip() for m in mentors_to_add if m.strip()]:
            mentor, created = Mentor.objects.get_or_create(name=mentor_name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Added mentor: {mentor_name}'))
                added_count += 1
            else:
                self.stdout.write(self.style.WARNING(f'⊘ Mentor already exists: {mentor_name}'))
                skipped_count += 1

        self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully added {added_count} new mentor(s)'))
        if skipped_count:
            self.stdout.write(self.style.WARNING(f'⊘ Skipped {skipped_count} existing mentor(s)'))
# ...existing code...